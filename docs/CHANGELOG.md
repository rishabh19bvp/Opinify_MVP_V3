# Changelog

This document tracks the troubleshooting and resolution steps for the Opinify MVP V3 project.

## Session Summary

The primary goal of this session was to resolve a native iOS build crash in a React Native (Expo) project. The initial error was a `non-std C++ exception` occurring deep within the React Native runtime, which pointed to fundamental issues with dependencies or the build environment.

### Initial State
- Project had an unconventional structure with the React Native app nested inside an `app/` directory.
- `package.json` contained multiple dependencies with versions incompatible with the installed Expo SDK.
- The iOS build was failing with a cryptic C++ exception.

### Troubleshooting Journey

1.  **Initial Diagnosis**: Identified the C++ exception as a symptom of deeper configuration or dependency problems. A multi-step "repair playbook" was proposed.

2.  **Dependency Hell**:
    *   Attempted to run `npx expo install` to fix JavaScript dependencies, but it failed due to an invalid version of `expo-media-library`.
    *   Ran `npx expo-doctor`, which revealed numerous incompatible package versions and an incorrect `sdkVersion` key in the Expo config.
    *   Used `npx expo install --fix` to automatically correct all JS dependency versions.
    *   Removed the incorrect `sdkVersion` key from `app/app.json`.

3.  **CocoaPods Pathing Nightmare**:
    *   After fixing JS dependencies, `pod install` failed because the `Podfile` could not locate the `expo` and `react-native` packages due to the non-standard project structure.
    *   Multiple attempts were made to fix this by modifying the `Podfile` with relative paths, absolute paths, and `post_install` hooks. Each attempt failed at a different stage of the `pod install` process, highlighting the fragility of the custom setup.

4.  **The "Big Fix" - Project Restructuring**:
    *   Concluded that the unconventional project structure was the root cause of the persistent `pod install` failures.
    *   Executed a plan to standardize the project layout:
        1.  Moved all contents from the `app/` subdirectory to the project root.
        2.  Deleted the now-empty `app/` directory.
        3.  Reverted the `Podfile` to its original, default state.
    *   This immediately fixed all CocoaPods pathing issues, and `pod install` completed successfully.

5.  **Final Build Issue - Xcode Destination**:
    *   With dependencies finally resolved, `npx expo run:ios` failed with a new error: `Unable to find a destination matching the provided destination specifier`.
    *   This indicated a stale or corrupt Xcode build cache or simulator state.
    *   Cleared Xcode's `DerivedData` to force a clean build.
    *   When the error persisted, the final recommendation was to open the project in the Xcode IDE (`.xcworkspace`) and build/run it directly, which often resolves such destination issues.

### Final State
- The project is now in a standard, clean, and buildable state.
- All JavaScript and iOS dependencies are correctly installed and versioned.
- All pathing issues have been resolved by conforming to the standard Expo project layout.
- The final step is to build and run the app from Xcode to resolve the simulator destination error.
