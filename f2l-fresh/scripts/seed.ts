import { db } from '../src/lib/db';

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const admin = await db.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'admin123', // In production, use hashed passwords
      role: 'admin',
    },
  });

  console.log('Admin user created:', admin);

  // Create sample stream
  const stream = await db.stream.create({
    data: {
      title: 'قناة الاخبار',
      description: 'بث مباشر للأخبار على مدار الساعة',
      thumbnail: 'https://via.placeholder.com/640x360',
      published: true,
      authorId: admin.id,
      servers: {
        create: [
          {
            name: 'الخادم 1',
            url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            priority: 0,
          },
          {
            name: 'الخادم 2',
            url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            priority: 1,
          },
          {
            name: 'الخادم 3',
            url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            priority: 2,
          },
          {
            name: 'الخادم 4',
            url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            priority: 3,
          },
        ],
      },
    },
  });

  console.log('Sample stream created:', stream);

  // Create sample ads
  await db.ad.create({
    data: {
      position: 'home-top',
      title: 'إعلان مميز',
      imageUrl: 'https://via.placeholder.com/728x90',
      linkUrl: '#',
      active: true,
    },
  });

  await db.ad.create({
    data: {
      position: 'home-bottom',
      title: 'إعلان ترويجي',
      imageUrl: 'https://via.placeholder.com/728x90',
      linkUrl: '#',
      active: true,
    },
  });

  console.log('Sample ads created');

  console.log('Database seed completed successfully!');
  console.log('\n=== Admin Login Credentials ===');
  console.log('Email: admin@example.com');
  console.log('Password: admin123');
  console.log('Admin Panel URL: /admin-portal-secure-2025-x7k9m2');
  console.log('================================\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
