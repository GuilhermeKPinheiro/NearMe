import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { getErrorMessage } from '@/services/http';
import { getCurrentDeviceLocation } from '@/services/location';
import {
  createVenue,
  listMyVenues,
  type CreateVenueDraft,
  updateVenue,
} from '@/services/venues';
import { colors } from '@/theme/colors';

const radiusOptions = [100, 180, 250, 400];

const emptyDraft: CreateVenueDraft = {
  name: '',
  description: '',
  coverImageUrl: '',
  city: '',
  locationLabel: '',
  latitude: 0,
  longitude: 0,
  radiusMeters: 180,
  privacy: 'PUBLIC',
};

export default function EventEditorScreen() {
  const router = useRouter();
  const { venueId } = useLocalSearchParams<{ venueId?: string }>();
  const [draft, setDraft] = useState<CreateVenueDraft>(emptyDraft);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!venueId) {
      return;
    }

    listMyVenues()
      .then((venues) => {
        const venue = venues.find((item) => item.id === venueId);

        if (!venue) {
          setMessage('Evento ou Local nao encontrado.');
          return;
        }

        setDraft({
          name: venue.name,
          description: venue.description ?? '',
          coverImageUrl: venue.coverImageUrl ?? '',
          city: venue.city,
          locationLabel: venue.locationLabel ?? '',
          latitude: venue.latitude ?? 0,
          longitude: venue.longitude ?? 0,
          radiusMeters: venue.radiusMeters,
          privacy: venue.privacy ?? 'PUBLIC',
        });
      })
      .catch((nextError) => setMessage(getErrorMessage(nextError)));
  }, [venueId]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setMessage('Permita acesso as fotos para escolher a capa.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.85,
    });

    if (!result.canceled) {
      setDraft((current) => ({ ...current, coverImageUrl: result.assets[0]?.uri ?? current.coverImageUrl }));
    }
  };

  const syncCurrentLocation = async () => {
    try {
      const location = await getCurrentDeviceLocation();
      setDraft((current) => ({
        ...current,
        latitude: location.latitude,
        longitude: location.longitude,
      }));
      setMessage('Localizacao atual vinculada ao Evento/Local.');
    } catch (nextError) {
      setMessage(getErrorMessage(nextError));
    }
  };

  const save = async () => {
    try {
      setIsSaving(true);
      setMessage('');

      let latitude = draft.latitude;
      let longitude = draft.longitude;

      if (!latitude || !longitude) {
        const location = await getCurrentDeviceLocation();
        latitude = location.latitude;
        longitude = location.longitude;
      }

      if (venueId) {
        await updateVenue(venueId, {
          ...draft,
          latitude,
          longitude,
        });
      } else {
        await createVenue({
          ...draft,
          latitude,
          longitude,
        });
      }

      router.back();
    } catch (nextError) {
      setMessage(getErrorMessage(nextError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: 16 }}>
        <View style={{ gap: 6 }}>
          <AppText variant="eyebrow">{venueId ? 'Editar' : 'Criar'}</AppText>
          <AppText variant="title">{venueId ? 'Atualizar Evento ou Local.' : 'Novo Evento ou Local.'}</AppText>
          <AppText variant="bodyMuted">
            Informacoes essenciais: nome, privacidade, cidade, referencia do local, capa e coordenadas atuais.
          </AppText>
        </View>

        <Card>
          {draft.coverImageUrl ? (
            <Image source={{ uri: draft.coverImageUrl }} style={{ width: '100%', height: 220, borderRadius: 24 }} />
          ) : (
            <View
              style={{
                height: 220,
                borderRadius: 24,
                backgroundColor: colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText variant="bodyMuted">Adicione uma capa para fortalecer a identidade do Evento/Local.</AppText>
            </View>
          )}
          <SecondaryButton title="Escolher capa" onPress={pickImage} />
        </Card>

        <Card>
          <Input label="Nome" placeholder="Ex: Sunset Rooftop" value={draft.name} onChangeText={(value) => setDraft((current) => ({ ...current, name: value }))} />
          <Input
            label="Descricao"
            placeholder="Musica, publico, horario, clima do local..."
            value={draft.description}
            onChangeText={(value) => setDraft((current) => ({ ...current, description: value }))}
            multiline
            numberOfLines={4}
            style={{ minHeight: 100, textAlignVertical: 'top' }}
          />
          <Input label="Cidade" placeholder="Sao Paulo" value={draft.city} onChangeText={(value) => setDraft((current) => ({ ...current, city: value }))} />
          <Input
            label="Referencia do local"
            placeholder="Ex: Rooftop Bela Vista, entrada lateral"
            value={draft.locationLabel}
            onChangeText={(value) => setDraft((current) => ({ ...current, locationLabel: value }))}
          />
        </Card>

        <Card>
          <AppText variant="sectionTitle">Privacidade</AppText>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              {draft.privacy === 'PUBLIC' ? (
                <PrimaryButton title="Publico" compact onPress={() => undefined} />
              ) : (
                <SecondaryButton title="Publico" compact onPress={() => setDraft((current) => ({ ...current, privacy: 'PUBLIC' }))} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              {draft.privacy === 'INVITE_ONLY' ? (
                <PrimaryButton title="Privado por convite" compact onPress={() => undefined} />
              ) : (
                <SecondaryButton
                  title="Privado por convite"
                  compact
                  onPress={() => setDraft((current) => ({ ...current, privacy: 'INVITE_ONLY' }))}
                />
              )}
            </View>
          </View>
        </Card>

        <Card>
          <AppText variant="sectionTitle">Area do local</AppText>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {radiusOptions.map((radius) => (
              <View key={radius} style={{ flex: 1 }}>
                {draft.radiusMeters === radius ? (
                  <PrimaryButton title={`${radius} m`} compact onPress={() => undefined} />
                ) : (
                  <SecondaryButton title={`${radius} m`} compact onPress={() => setDraft((current) => ({ ...current, radiusMeters: radius }))} />
                )}
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <AppText variant="sectionTitle">Coordenadas</AppText>
          <AppText variant="bodyMuted">
            {draft.latitude && draft.longitude
              ? `Lat ${draft.latitude.toFixed(5)} | Lon ${draft.longitude.toFixed(5)}`
              : 'Ainda sem coordenadas. Use sua localizacao atual para garantir geofence e saida automatica.'}
          </AppText>
          <SecondaryButton title="Usar localizacao atual" onPress={() => void syncCurrentLocation()} />
        </Card>

        {message ? <AppText variant="bodyMuted">{message}</AppText> : null}
        <PrimaryButton
          title={isSaving ? 'Salvando...' : venueId ? 'Salvar alteracoes' : 'Criar Evento/Local'}
          disabled={isSaving || !draft.name || !draft.city || !draft.locationLabel}
          onPress={() => void save()}
        />
      </View>
    </Screen>
  );
}
