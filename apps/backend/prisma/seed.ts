import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { AuthProvider, VisibilitySource } from '../src/generated/prisma/enums';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DATABASE_URL ?? 'postgresql://postgres:123456@localhost:5432/nearme?schema=public',
  }),
});

async function ensureUser(input: {
  email: string;
  name: string;
  password?: string;
  headline: string;
  bio: string;
  professionTag: string;
  city: string;
  photoUrl?: string;
  instagramUrl?: string;
  linkedInUrl?: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    await prisma.profile.upsert({
      where: { userId: existing.id },
      update: {
        displayName: input.name,
        headline: input.headline,
        bio: input.bio,
        professionTag: input.professionTag,
        city: input.city,
        photoUrl: input.photoUrl,
        instagramUrl: input.instagramUrl,
        linkedInUrl: input.linkedInUrl,
      },
      create: {
        userId: existing.id,
        displayName: input.name,
        headline: input.headline,
        bio: input.bio,
        professionTag: input.professionTag,
        city: input.city,
        photoUrl: input.photoUrl,
        instagramUrl: input.instagramUrl,
        linkedInUrl: input.linkedInUrl,
      },
    });

    return existing;
  }

  return prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      authProvider: input.password ? AuthProvider.EMAIL : AuthProvider.GOOGLE,
      emailVerifiedAt: new Date(),
      googleId: input.password ? null : `seed-${input.email}`,
      passwordHash: input.password ? await hash(input.password, 10) : null,
      profile: {
        create: {
          displayName: input.name,
          headline: input.headline,
          bio: input.bio,
          professionTag: input.professionTag,
          city: input.city,
          photoUrl: input.photoUrl,
          instagramUrl: input.instagramUrl,
          linkedInUrl: input.linkedInUrl,
        },
      },
      visibilitySessions: {
        create: {
          source: VisibilitySource.MOCK,
        },
      },
    },
  });
}

async function main() {
  const venue = await prisma.venue.upsert({
    where: { slug: 'vault-sp' },
    update: {
      name: 'Vault SP',
      joinCode: 'VAULTSP',
      privacy: 'PUBLIC',
      city: 'Sao Paulo',
      locationLabel: 'Consolacao',
      latitude: -23.561684,
      longitude: -46.655981,
      radiusMeters: 220,
      isActive: true,
    },
    create: {
      slug: 'vault-sp',
      joinCode: 'VAULTSP',
      name: 'Vault SP',
      privacy: 'PUBLIC',
      city: 'Sao Paulo',
      locationLabel: 'Consolacao',
      latitude: -23.561684,
      longitude: -46.655981,
      radiusMeters: 220,
      isActive: true,
    },
  });

  const demo = await ensureUser({
    email: 'demo@nearme.app',
    name: 'Demo User',
    password: '123456',
    headline: 'Product Builder',
    bio: 'Conta local para testar o fluxo do MVP.',
    professionTag: 'Produto',
    city: 'Sao Paulo',
    instagramUrl: 'https://instagram.com/demo',
    linkedInUrl: 'https://linkedin.com/in/demo',
  });

  await ensureUser({
    email: 'ana@nearme.app',
    name: 'Ana Silva',
    headline: 'UX Designer | Freelancer',
    bio: 'Ajudo marcas a criar experiencias mais simples e bonitas.',
    professionTag: 'UX',
    city: 'Sao Paulo',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
    instagramUrl: 'https://instagram.com/ana',
    linkedInUrl: 'https://linkedin.com/in/ana',
  });

  await ensureUser({
    email: 'joao@nearme.app',
    name: 'Joao Pedro',
    headline: 'Dev Backend | NestJS',
    bio: 'Construo APIs escalaveis para produtos em crescimento.',
    professionTag: 'Backend',
    city: 'Sao Paulo',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    instagramUrl: 'https://instagram.com/joao',
    linkedInUrl: 'https://linkedin.com/in/joao',
  });

  const ana = await prisma.user.findUniqueOrThrow({
    where: { email: 'ana@nearme.app' },
  });

  const existingRequest = await prisma.connectionRequest.findFirst({
    where: {
      fromUserId: ana.id,
      toUserId: demo.id,
    },
  });

  if (!existingRequest) {
    await prisma.connectionRequest.create({
      data: {
        fromUserId: ana.id,
        toUserId: demo.id,
      },
    });
  }

  await prisma.visibilitySession.updateMany({
    where: {
      isActive: true,
      userId: {
        in: [demo.id, ana.id],
      },
    },
    data: {
      venueId: venue.id,
      latitude: -23.5618,
      longitude: -46.6561,
      accuracyMeters: 25,
    },
  });

  console.log('Seed completed');
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
