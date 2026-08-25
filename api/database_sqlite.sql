CREATE TABLE IF NOT EXISTS convoi (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    categorie   VARCHAR(1)  NOT NULL DEFAULT "",
    masse       FLOAT       NOT NULL,
    essieu      FLOAT       NULL,
    largeur     FLOAT       NOT NULL,
    hauteur     FLOAT       NOT NULL,
    longueur    FLOAT       NOT NULL,
    vitesse     FLOAT       NULL,
    date_passage DATE       NULL,
    statut      VARCHAR(10) NOT NULL DEFAULT "pass",
    created_at  DATETIME    NOT NULL
);
CREATE TABLE IF NOT EXISTS troncon (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    convoi_id   INT         NOT NULL,
    route       VARCHAR(10) NOT NULL,
    pr_debut    VARCHAR(20) NULL,
    pr_fin      VARCHAR(20) NULL,
    sens        VARCHAR(20) NULL,
    FOREIGN KEY (convoi_id) REFERENCES convoi(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS utilisateur (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nom         VARCHAR(100)  NOT NULL,
    email       VARCHAR(150)  NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    role        VARCHAR(20)   NOT NULL DEFAULT "agent",
    actif       INTEGER       NOT NULL DEFAULT 1,
    created_at  DATETIME      NOT NULL
);
CREATE TABLE IF NOT EXISTS verification_detail (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    convoi_id   INT          NOT NULL,
    critere     VARCHAR(100) NOT NULL,
    valeur      VARCHAR(50)  NOT NULL,
    limite      VARCHAR(50)  NOT NULL,
    tag         VARCHAR(10)  NOT NULL,
    detail      VARCHAR(255) NOT NULL,
    FOREIGN KEY (convoi_id) REFERENCES convoi(id) ON DELETE CASCADE
);
-- Le hash ci-dessous est un exemple qui ne correspond à aucun mot de passe
-- utilisable : bin/installer.php le remplace par un mot de passe généré
-- aléatoirement au premier lancement (voir MOT-DE-PASSE-INITIAL.txt).
INSERT INTO utilisateur (nom, email, mot_de_passe, role, actif, created_at)
SELECT "Administrateur", "admin@dirno.fr", "$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe6D/H8K", "admin", 1, datetime("now")
WHERE NOT EXISTS (SELECT 1 FROM utilisateur WHERE email = "admin@dirno.fr");
