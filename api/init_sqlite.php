<?php
$db = new PDO("sqlite:var/data.db");
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$sql = file_get_contents("database_sqlite.sql");
$statements = explode(";", $sql);
foreach ($statements as $statement) {
    $statement = trim($statement);
    if (!empty($statement)) {
        $db->exec($statement);
    }
}
echo "Base SQLite creee avec succes !";

