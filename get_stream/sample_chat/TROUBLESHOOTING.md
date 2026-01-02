# Troubleshooting Guide

## Common Issues and Solutions

### Issue: Flutter App Won't Run - CocoaPods FFI Error

**Symptoms:**
- `flutter run` fails with exit code 1
- Error message: `LoadError - cannot load such file -- ffi_c`
- CocoaPods shows as "installed but broken"
- Error during `pod install` process

**Root Cause:**
CocoaPods was installed via `gem install` and compiled against one Ruby version (e.g., system Ruby 2.6.10), but your shell is using a different Ruby version manager (rbenv, rvm) with a different Ruby version (e.g., Ruby 3.4.0). This causes native extension incompatibilities, particularly with the FFI (Foreign Function Interface) library.

**Solution:**
Install CocoaPods via Homebrew instead of RubyGems. Homebrew bundles CocoaPods with its own compatible Ruby version:

```bash
# 1. Uninstall gem-based CocoaPods
sudo gem uninstall cocoapods -a -x

# 2. Install via Homebrew
brew install cocoapods

# 3. Verify installation
which pod  # Should show: /opt/homebrew/bin/pod
pod --version
```

**Alternative Solution (if you must use gem):**
If you need to use gem-based CocoaPods, ensure the FFI gem is compiled for your active Ruby version:

```bash
gem uninstall ffi -a -x
gem install ffi --platform=ruby -- --enable-libffi-alloc
gem install cocoapods
```

---

### Issue: Dart Syntax Errors - Missing Class Names

**Symptoms:**
- Compilation errors in Dart code
- Missing identifiers before static method calls

**Example Error:**
```dart
// ❌ Wrong - missing class name
colorScheme: .fromSeed(seedColor: Colors.deepPurple)
mainAxisAlignment: .center

// ✅ Correct - include class name
colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple)
mainAxisAlignment: MainAxisAlignment.center
```

**Solution:**
Always include the class name when calling static methods or accessing enum values. Dart doesn't support implicit type inference for static members like some other languages.

---

## Best Practices

### Development Environment Setup

1. **Use Homebrew for macOS tools:**
   - CocoaPods: `brew install cocoapods`
   - Flutter: `brew install flutter` (or use official installer)

2. **Verify your environment:**
   ```bash
   flutter doctor -v
   which pod
   pod --version
   ```

3. **Keep tools updated:**
   ```bash
   brew upgrade cocoapods
   flutter upgrade
   ```

### Before Running Flutter iOS Apps

1. Clean build if encountering issues:
   ```bash
   flutter clean
   cd ios && rm -rf Pods Podfile.lock && cd ..
   flutter pub get
   ```

2. Check for iOS-specific errors:
   ```bash
   cd ios
   pod install --verbose
   cd ..
   ```

### When Switching Ruby Versions

If you use rbenv/rvm and switch Ruby versions, reinstall CocoaPods:
```bash
# If using gem-based installation
gem install cocoapods

# Or stick with Homebrew (recommended)
brew reinstall cocoapods
```

---

## Quick Reference

### Useful Commands

```bash
# Check Flutter setup
flutter doctor

# Clean build
flutter clean

# Force pod reinstall
cd ios && rm -rf Pods Podfile.lock && pod install --repo-update && cd ..

# Check which pod is being used
which pod

# Verify Ruby version
ruby --version

# Check gem-installed packages
gem list | grep cocoapods
```

### Getting Help

- Flutter documentation: https://docs.flutter.dev/
- CocoaPods guides: https://guides.cocoapods.org/
- Check GitHub issues for similar problems
- Run `flutter doctor` for diagnostic information

---

## Summary

The main takeaway is to **use Homebrew for CocoaPods installation on macOS** to avoid Ruby version compatibility issues. This provides a self-contained, reliable installation that won't conflict with your Ruby version manager.
