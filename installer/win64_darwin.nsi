!define APPNAME "MoGrabber"
!define COMPANYNAME "xTear"
!define DESCRIPTION "ReUpload to UL from FC"
!define _DIRNAME "MoGrabber"
# These three must be integers
!define VERSIONMAJOR 0
!define VERSIONMINOR 0
!define VERSIONBUILD 2
# These will be displayed by the "Click here for support information" link in "Add/Remove Programs"
# It is possible to use "mailto:" links in here to open the email client
!define HELPURL "https://github.com/username/MyApp/issues"
!define UPDATEURL "https://github.com/username/MyApp/releases"
!define ABOUTURL "https://github.com/username/MyApp"

Name "${APPNAME}"
Icon "..\deploy\assets\images\icon.ico"

# define the resulting installer's name:
OutFile "..\build\${APPNAME}-Setup-x64.exe"

# Destintation install directory
InstallDir "$DESKTOP\${APPNAME}"

# default section start
Section

  # define the path to which the installer should install
  SetOutPath "$INSTDIR"

  # specify the files to go in the output path
  # these are the Windows files produced by grunt-node-webkit-builder
  File "../deploy/assets/images/icon.ico"
  File "../build/${_DIRNAME}/win64/ffmpegsumo.dll"
  File "../build/${_DIRNAME}/win64/icudtl.dat"
  File "../build/${_DIRNAME}/win64/libEGL.dll"
  File "../build/${_DIRNAME}/win64/libGLESv2.dll"
  File "../build/${_DIRNAME}/win64/nw.pak"
  File "../build/${_DIRNAME}/win64/${APPNAME}.exe"

  # define the uninstaller name
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  # create a shortcut in the start menu
  CreateDirectory "$SMPROGRAMS\${APPNAME}"
  CreateShortCut "$SMPROGRAMS\${APPNAME}\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortCut "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk" "$INSTDIR\${APPNAME}.exe" "" "$INSTDIR\icon.ico"

  SectionEnd

# create a section to define what the uninstaller does
Section "Uninstall"

  # delete the uninstaller
  Delete $INSTDIR\Uninstall.exe

  # delete the installed files
  Delete "$INSTDIR\icon.ico"
  Delete "$INSTDIR\ffmpegsumo.dll"
  Delete "$INSTDIR\icudt.dll"
  Delete "$INSTDIR\libEGL.dll"
  Delete "$INSTDIR\libGLESv2.dll"
  Delete "$INSTDIR\nw.pak"
  Delete "$INSTDIR\${APPNAME}.exe"
  Delete "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk"
  Delete "$SMPROGRAMS\${APPNAME}\Uninstall.lnk"
  rmDir "$SMPROGRAMS\${APPNAME}"
  rmDir $INSTDIR

  # Remove uninstaller information from the registry

SectionEnd
