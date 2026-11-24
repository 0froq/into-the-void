export const PACKAGE_NAME = "into-the-void";
export const LEGACY_PACKAGE_NAME = "void-jingle";

export const INSTALL_BEGIN_MARKER = "# >>> into-the-void begin >>>";
export const INSTALL_END_MARKER = "# <<< into-the-void end <<<";
export const LEGACY_INSTALL_BEGIN_MARKER = "# >>> void-jingle begin >>>";
export const LEGACY_INSTALL_END_MARKER = "# <<< void-jingle end <<<";

export const INSTALL_MARKER_PAIRS: ReadonlyArray<readonly [string, string]> = [
  [INSTALL_BEGIN_MARKER, INSTALL_END_MARKER],
  [LEGACY_INSTALL_BEGIN_MARKER, LEGACY_INSTALL_END_MARKER],
];

export const CONFIG_DIR_NAME = "into-the-void";
export const LEGACY_CONFIG_DIR_NAME = "void-jingle";
export const CONFIG_FILE_NAME = "config.json";

export const PACKAGE_JSON_CONFIG_KEY = "intoTheVoid";
export const LEGACY_PACKAGE_JSON_CONFIG_KEY = "voidJingle";
