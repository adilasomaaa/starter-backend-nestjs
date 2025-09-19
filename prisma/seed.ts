import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

async function main() {
    console.log('Start a seeder ...')

    const saltRounds = 10;

    const permissionToCreate = [
        {
            name:'manage_profile',
        },
        {
            name:'manage_community',
        },
        {
            name:'manage_post'
        },
        {
            name:'create_post'
        },
        {
            name:'create_comment'
        },
        {
            name:'create_community'
        },
    ];

    const rolesAndPermissions = {
        admin: [
            'manage_profile',
            'manage_community',
            'manage_post'
        ],
        client:[
            'create_post',
            'create_comment',
            'create_community'
        ]
    }

    for(const data of permissionToCreate) {
        await prisma.permission.upsert({
            where: {name:data.name},
            update: {},
            create: {name:data.name}
        })
    }

    for (const roleName in rolesAndPermissions) {
        // Buat Role
        const role = await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });

        // Ambil daftar permission untuk role ini
        const permissionsForRole = rolesAndPermissions[roleName];
        if (permissionsForRole) {
            // Dapatkan objek Permission dari database berdasarkan namanya
            const permissionsInDb = await prisma.permission.findMany({
                where: { name: { in: permissionsForRole } },
            });

            // Hubungkan setiap permission ke role
            for (const perm of permissionsInDb) {
                await prisma.rolePermission.upsert({
                    where: { 
                        roleId_permissionId: { roleId: role.id, permissionId: perm.id }
                    },
                    update: {},
                    create: { roleId: role.id, permissionId: perm.id },
                });
            }
        }
    }

    console.log('Membuat user admin...');
    const adminPassword = await bcrypt.hash('password', saltRounds);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@app.id' },
        update: {},
        create: {
            username: 'superadmin',
            email: 'admin@app.id',
            password: adminPassword,
        },
    });

    // 4. Buat User Client
    console.log('Membuat user client...');
    const clientPassword = await bcrypt.hash('password', saltRounds);
    const clientUser = await prisma.user.upsert({
        where: { email: 'client@app.id' },
        update: {},
        create: {
            username: 'Johndoe',
            email: 'client@app.id',
            password: clientPassword,
        },
    });

    // 5. Hubungkan Users ke Roles
    console.log('Menghubungkan users ke roles...');
    const adminRoleFromDb = await prisma.role.findUnique({ where: { name: 'admin' } });
    const clientRoleFromDb = await prisma.role.findUnique({ where: { name: 'client' } });

    if (adminRoleFromDb) {
        await prisma.userRole.upsert({
            where: { userId_roleId: { userId: adminUser.id, roleId: adminRoleFromDb.id } },
            update: {},
            create: { userId: adminUser.id, roleId: adminRoleFromDb.id },
        });
    }

    if (clientRoleFromDb) {
        await prisma.userRole.upsert({
            where: { userId_roleId: { userId: clientUser.id, roleId: clientRoleFromDb.id } },
            update: {},
            create: { userId: clientUser.id, roleId: clientRoleFromDb.id },
        });
    }

    // 6. Buat Profil Client
    console.log('Membuat profil client...');
    await prisma.profile.upsert({
        where: { userId: clientUser.id },
        update: {},
        create: {
            name: 'John Doe',
            username: 'johndoe',
            photo:'default.png',
            bio:'Hello world',
            userId: clientUser.id,
        },
    });

    console.log(`Seeding selesai.`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });