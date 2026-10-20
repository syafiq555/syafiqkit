# Capturing a Flutter app's real screens

A widget test with goldens renders the real widgets, with the project's own network stubs, at any phone size, with no device, no sign-in and no account. It is the fastest route to true UI for a clip.

Three things make the output wrong without any error:

- **Fonts.** `flutter test` does not load the fonts declared in `pubspec.yaml`; every glyph draws as a solid box. Load each family with `FontLoader` from the `.ttf` files before the first pump.
- **Icon fonts from packages.** The family name a package's `IconData` asks for is `packages/<package>/<family>`, and the file sits in the pub cache (`~/.pub-cache/hosted/pub.dev/<package>-<version>/...`), not in the project.
- **The DEBUG ribbon** sits in the top corner of every capture until `WidgetsApp.debugAllowBannerOverride = false` is set.

Sketch (adapt the harness and fixture calls to the project's own test support):

```dart
Future<void> _loadFonts() async {
  final families = {
    'Manrope': ['400', '700', '800'].map((w) => 'assets/fonts/Manrope-$w.ttf'),
  };
  for (final entry in families.entries) {
    final loader = FontLoader(entry.key);
    for (final path in entry.value) {
      loader.addFont(Future.value(ByteData.sublistView(File(path).readAsBytesSync())));
    }
    await loader.load();
  }
  final home = Platform.environment['HOME'];
  final icons = FontLoader('packages/flutter_tabler_icons/tabler-icons')
    ..addFont(Future.value(ByteData.sublistView(File(
        '$home/.pub-cache/hosted/pub.dev/flutter_tabler_icons-1.43.0/assets/fonts/tabler-icons.ttf').readAsBytesSync())));
  await icons.load();
}

void main() {
  setUpAll(() async {
    WidgetsApp.debugAllowBannerOverride = false;
    await _loadFonts();
  });

  testWidgets('launch clip screens', (tester) async {
    tester.view.physicalSize = const Size(1170, 2532);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    await pumpSignedInApp(tester, demoAdapter());           // the project's own harness
    await expectLater(find.byType(MaterialApp), matchesGoldenFile('launch_shots/01_home.png'));
    // tap through the flow, one golden per screen the clip needs
  });
}
```

Run it with `flutter test test/launch_capture_test.dart --update-goldens`; the PNGs land beside the test in `launch_shots/`. Copy them to the clip folder.

Two driving mistakes produce goldens that look like captures landing one step late:

- **A keyboard "done" can submit the form.** `testTextInput.receiveAction(TextInputAction.done)` after typing fires the field's submit, which may open the next step (a confirm sheet). The golden meant for the filled-in field then shows the sheet, and the next tap closes it, so the sequence reads shifted. Dismiss the keyboard with `FocusManager.instance.primaryFocus?.unfocus()` instead.
- **`pumpAndSettle` doesn't wait for real async work.** After a tap that calls the network (even a stub), poll until the expected text appears (`runAsync` a short delay, `pump`, repeat) before the golden, or it captures the screen before the result.

Look at each golden next to its name before going on; identical checksums for two different steps mean one of them caught the wrong moment.

The screens carry no status bar. The film template draws one (time, signal, battery) in the colour of each screen's top edge, so give it that colour per screen.
