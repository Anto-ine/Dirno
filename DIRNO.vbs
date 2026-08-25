' ===================================================================
'  DIRNO - Lanceur
'
'  Demarre l'application sans afficher de fenetre de terminal et
'  cree un raccourci "DIRNO" sur le Bureau au premier lancement.
' ===================================================================

Dim shell, fso, dossier, bureau, raccourci, cheminRaccourci
Set shell = CreateObject("WScript.Shell")
Set fso   = CreateObject("Scripting.FileSystemObject")

dossier = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

' --- Raccourci sur le Bureau (cree une seule fois) -----------------
bureau = shell.SpecialFolders("Desktop")
cheminRaccourci = bureau & "\DIRNO.lnk"

If Not fso.FileExists(cheminRaccourci) Then
    Set raccourci = shell.CreateShortcut(cheminRaccourci)
    raccourci.TargetPath       = WScript.ScriptFullName
    raccourci.WorkingDirectory = dossier
    raccourci.Description      = "DIRNO - Verification des transports exceptionnels"
    raccourci.IconLocation     = "shell32.dll,13"
    raccourci.Save
End If

' --- Demarrage -----------------------------------------------------
' 0 = fenetre masquee, False = ne pas attendre la fin du script
shell.Run """" & dossier & "demarrer-dirno.bat""", 0, False
