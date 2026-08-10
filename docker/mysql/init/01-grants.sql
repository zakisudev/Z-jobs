-- Allow Prisma Migrate to create shadow databases during development
GRANT ALL PRIVILEGES ON *.* TO 'zjobs'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
