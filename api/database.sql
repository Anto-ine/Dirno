-- Création de la base de données
CREATE DATABASE IF NOT EXISTS dirno CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE dirno;

-- Table convoi
CREATE TABLE IF NOT EXISTS convoi (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    categorie   VARCHAR(1)  NOT NULL,
    masse       FLOAT       NOT NULL,
    essieu      FLOAT       NULL,
    largeur     FLOAT       NOT NULL,
    hauteur     FLOAT       NOT NULL,
    longueur    FLOAT       NOT NULL,
    vitesse     FLOAT       NULL,
    date_passage DATE       NULL,
    statut      VARCHAR(10) NOT NULL DEFAULT 'pass',
    created_at  DATETIME    NOT NULL
);

-- Table troncon
CREATE TABLE IF NOT EXISTS troncon (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    convoi_id   INT         NOT NULL,
    route       VARCHAR(10) NOT NULL,
    pr_debut    VARCHAR(20) NULL,
    pr_fin      VARCHAR(20) NULL,
    sens        VARCHAR(20) NULL,
    CONSTRAINT fk_troncon_convoi FOREIGN KEY (convoi_id) REFERENCES convoi(id) ON DELETE CASCADE
);

-- Table ouvrages d'art
CREATE TABLE IF NOT EXISTS ouvrage (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    voie                VARCHAR(10)  NOT NULL,
    pr                  FLOAT        NOT NULL,
    abscisse            FLOAT        NULL,
    district            VARCHAR(50)  NULL,
    cei                 VARCHAR(50)  NULL,
    identifiant         VARCHAR(50)  NULL,
    nom                 VARCHAR(255) NULL,
    type_ouvrage        VARCHAR(50)  NULL,
    longueur            FLOAT        NULL,
    nombre_travees      INT          NULL,
    largeur_utile       FLOAT        NULL,
    note_iqoa           VARCHAR(10)  NULL,
    annee_note_iqoa     INT          NULL,
    annee_construction  INT          NULL,
    charge_militaire    FLOAT        NULL,
    autres_convois      FLOAT        NULL,
    carte_te            FLOAT        NULL
    
);
-- Table utilisateurs
CREATE TABLE IF NOT EXISTS utilisateur (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nom         VARCHAR(100)  NOT NULL,
    email       VARCHAR(150)  NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    role        VARCHAR(20)   NOT NULL DEFAULT 'agent',
    actif       TINYINT(1)    NOT NULL DEFAULT 1,
    created_at  DATETIME      NOT NULL
);

-- Compte admin par défaut.
-- Le hash ci-dessous est un exemple qui ne correspond à aucun mot de passe
-- utilisable : bin/installer.php le remplace par un mot de passe généré
-- aléatoirement au premier lancement (voir MOT-DE-PASSE-INITIAL.txt).
INSERT INTO utilisateur (nom, email, mot_de_passe, role, actif, created_at)
VALUES (
    'Administrateur',
    'admin@dirno.fr',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe6D/H8K',
    'admin',
    1,
    NOW()
);

-- Table détails de vérification
CREATE TABLE IF NOT EXISTS verification_detail (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    convoi_id   INT          NOT NULL,
    critere     VARCHAR(100) NOT NULL,
    valeur      VARCHAR(50)  NOT NULL,
    limite      VARCHAR(50)  NOT NULL,
    tag         VARCHAR(10)  NOT NULL,
    detail      VARCHAR(255) NOT NULL,
    CONSTRAINT fk_detail_convoi FOREIGN KEY (convoi_id) REFERENCES convoi(id) ON DELETE CASCADE
);