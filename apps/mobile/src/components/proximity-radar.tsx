import { View } from 'react-native';
import { AppText } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Venue } from '@/types/domain';

type Coordinate = {
  latitude: number;
  longitude: number;
};

type ProximityRadarProps = {
  center: Coordinate | null;
  radiusMeters: number;
  venues: Venue[];
};

const RADAR_SIZE = 250;
const RADAR_CENTER = RADAR_SIZE / 2;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMeters(from: Coordinate, to: Coordinate) {
  const earthRadius = 6_371_000;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function calculateBearing(from: Coordinate, to: Coordinate) {
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);

  const y = Math.sin(deltaLon) * Math.cos(toLat);
  const x = Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLon);
  return Math.atan2(y, x);
}

export function ProximityRadar({ center, radiusMeters, venues }: ProximityRadarProps) {
  const visibleVenues = center
    ? venues
        .filter((venue) => typeof venue.latitude === 'number' && typeof venue.longitude === 'number')
        .map((venue) => {
          const coordinate = {
            latitude: venue.latitude as number,
            longitude: venue.longitude as number,
          };
          const distanceMeters = calculateDistanceMeters(center, coordinate);
          const bearing = calculateBearing(center, coordinate);
          return {
            venue,
            distanceMeters,
            ratio: Math.min(distanceMeters / Math.max(radiusMeters, 100), 1),
            bearing,
          };
        })
        .sort((left, right) => left.distanceMeters - right.distanceMeters)
    : [];

  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 4 }}>
        <AppText variant="eyebrow">Radar privado</AppText>
        <AppText variant="sectionTitle">Voce no centro. Eventos ao redor.</AppText>
        <AppText variant="bodyMuted">
          Pessoas nao entram no mapa. O radar mostra apenas voce, o seu alcance e os locais disponiveis.
        </AppText>
      </View>

      <View
        style={{
          alignSelf: 'center',
          width: RADAR_SIZE,
          height: RADAR_SIZE,
          borderRadius: RADAR_CENTER,
          backgroundColor: colors.surfaceAlt,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {[1, 2, 3].map((ring) => {
          const size = (RADAR_SIZE / 3) * ring;
          return (
            <View
              key={ring}
              style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            />
          );
        })}

        <View style={{ position: 'absolute', width: 1, height: RADAR_SIZE, backgroundColor: colors.borderSubtle, opacity: 0.4 }} />
        <View style={{ position: 'absolute', width: RADAR_SIZE, height: 1, backgroundColor: colors.borderSubtle, opacity: 0.4 }} />

        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: colors.accentStrong,
            borderWidth: 4,
            borderColor: colors.background,
            zIndex: 2,
          }}
        />

        {visibleVenues.slice(0, 8).map(({ venue, ratio, bearing }) => {
          const travel = ratio * (RADAR_CENTER - 18);
          const x = Math.sin(bearing) * travel;
          const y = -Math.cos(bearing) * travel;

          return (
            <View
              key={venue.id}
              style={{
                position: 'absolute',
                left: RADAR_CENTER + x - 10,
                top: RADAR_CENTER + y - 10,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: venue.privacy === 'PUBLIC' ? colors.accentWarm : colors.accent,
                borderWidth: 3,
                borderColor: colors.background,
              }}
            />
          );
        })}
      </View>

      <View style={{ gap: 8 }}>
        <AppText variant="bodyMuted">Raio ativo: {radiusMeters >= 1000 ? `${radiusMeters / 1000} km` : `${radiusMeters} m`}</AppText>
        {center ? (
          visibleVenues.length ? (
            visibleVenues.slice(0, 4).map(({ venue, distanceMeters }) => (
              <View
                key={venue.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surfaceAlt,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="body">{venue.name}</AppText>
                  <AppText variant="bodyMuted">
                    {venue.city}
                    {venue.locationLabel ? ` | ${venue.locationLabel}` : ''}
                  </AppText>
                </View>
                <AppText variant="bodyMuted">{distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${Math.round(distanceMeters)} m`}</AppText>
              </View>
            ))
          ) : (
            <AppText variant="bodyMuted">Nenhum evento com coordenadas disponiveis no momento.</AppText>
          )
        ) : (
          <AppText variant="bodyMuted">Entre no radar para centralizar o mapa com sua localizacao atual.</AppText>
        )}
      </View>
    </View>
  );
}
