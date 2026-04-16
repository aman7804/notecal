IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306183517_initialcreate'
)
BEGIN
    CREATE TABLE [DayNotes] (
        [Id] int NOT NULL IDENTITY,
        [Date] date NOT NULL,
        CONSTRAINT [PK_DayNotes] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306183517_initialcreate'
)
BEGIN
    CREATE TABLE [Notes] (
        [Id] int NOT NULL IDENTITY,
        [Title] nvarchar(max) NOT NULL,
        [Text] nvarchar(max) NOT NULL,
        [DayNotesId] int NOT NULL,
        CONSTRAINT [PK_Notes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Notes_DayNotes_DayNotesId] FOREIGN KEY ([DayNotesId]) REFERENCES [DayNotes] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306183517_initialcreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_DayNotes_Date] ON [DayNotes] ([Date]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306183517_initialcreate'
)
BEGIN
    CREATE INDEX [IX_Notes_DayNotesId] ON [Notes] ([DayNotesId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306183517_initialcreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260306183517_initialcreate', N'10.0.3');
END;

COMMIT;
GO

