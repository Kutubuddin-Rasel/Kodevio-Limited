db = db.getSiblingDB('jotter_db');

db.createUser({
    user: 'jotter_app',
    pwd: 'jotter_app_password',
    roles: [
        {
            role: 'readWrite',
            db: 'jotter_db'
        }
    ]
});

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ googleId: 1 }, { unique: true, sparse: true });

db.folders.createIndex({ userId: 1, parentId: 1 });
db.folders.createIndex({ userId: 1, isFavorite: 1 });
db.folders.createIndex({ userId: 1, createdAt: -1 });

db.files.createIndex({ userId: 1, fileType: 1 });
db.files.createIndex({ userId: 1, parentId: 1 });
db.files.createIndex({ userId: 1, isFavorite: 1 });
db.files.createIndex({ userId: 1, createdAt: -1 });

db.notes.createIndex({ userId: 1, parentId: 1 });
db.notes.createIndex({ userId: 1, isFavorite: 1 });
db.notes.createIndex({ userId: 1, createdAt: -1 });
db.notes.createIndex({ userId: 1, title: 'text', content: 'text' });

print('Jotter database initialized successfully!');
