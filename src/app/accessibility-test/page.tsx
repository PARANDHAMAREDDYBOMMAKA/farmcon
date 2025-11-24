'use client';

import { useEffect, useState } from 'react';
import { debugAccessibility, keyboardNav } from '@/lib/accessibility';
import { useAccessibility } from '@/components/accessibility/AccessibilityProvider';

export default function AccessibilityTestPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [keyPressed, setKeyPressed] = useState<string>('');
  const { config, announce } = useAccessibility();

  useEffect(() => {
    // Run debug on mount
    const info = debugAccessibility();
    setDebugInfo(info);

    // Listen for key presses to show user what they're pressing
    const handleKeyPress = (e: KeyboardEvent) => {
      const parts: string[] = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.metaKey) parts.push('Cmd');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      parts.push(e.key);

      const combo = parts.join('+');
      setKeyPressed(combo);
      console.log('Key pressed:', combo);

      // Clear after 2 seconds
      setTimeout(() => setKeyPressed(''), 2000);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const testAnnouncement = () => {
    announce('This is a test announcement for screen readers', 'polite');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Accessibility Testing Page
        </h1>

        {/* Platform Detection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Platform Detection
          </h2>

          {debugInfo && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Detected Platform:</span>
                  <span className="ml-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                    {debugInfo.platform}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Modifier Key:</span>
                  <span className="ml-2 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                    {debugInfo.modifierKey}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-sm font-mono text-gray-600 dark:text-gray-300 break-all">
                  {debugInfo.userAgent}
                </p>
              </div>

              <div className="mt-4">
                <h3 className="font-medium mb-2">Detection Tests:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(debugInfo.tests).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Key Press Detector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Keyboard Shortcut Tester
          </h2>

          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Press any keyboard shortcut to test detection:
            </p>
            <div className="h-24 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
              {keyPressed ? (
                <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400">
                  {keyPressed}
                </div>
              ) : (
                <div className="text-gray-400 dark:text-gray-500">
                  Press any key combination...
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
              Expected Shortcuts for your platform:
            </h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li><kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">{debugInfo?.modifierKey}+H</kbd> - Go to home</li>
              <li><kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">{debugInfo?.modifierKey}+D</kbd> - Go to dashboard</li>
              <li><kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">{debugInfo?.modifierKey}+S</kbd> - Focus search</li>
              <li><kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">{debugInfo?.modifierKey}+M</kbd> - Skip to main content</li>
              <li><kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">{debugInfo?.modifierKey}+/</kbd> - Show all shortcuts</li>
            </ul>
          </div>
        </div>

        {/* Screen Reader Test */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Screen Reader Test
          </h2>

          <button
            onClick={testAnnouncement}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Test Screen Reader Announcement
          </button>

          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Enable your screen reader (VoiceOver on Mac, NVDA on Windows, Orca on Linux) and click the button above.
            You should hear an announcement.
          </p>
        </div>

        {/* Current Config */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Current Accessibility Settings
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Font Size:</span>
              <span className="font-medium">{config.fontSize}</span>
            </div>
            <div className="flex justify-between">
              <span>High Contrast:</span>
              <span className="font-medium">{config.highContrast ? '✅ Enabled' : '❌ Disabled'}</span>
            </div>
            <div className="flex justify-between">
              <span>Reduced Motion:</span>
              <span className="font-medium">{config.reducedMotion ? '✅ Enabled' : '❌ Disabled'}</span>
            </div>
            <div className="flex justify-between">
              <span>Keyboard Shortcuts:</span>
              <span className="font-medium">{config.enableKeyboardShortcuts ? '✅ Enabled' : '❌ Disabled'}</span>
            </div>
            <div className="flex justify-between">
              <span>Page Announcements:</span>
              <span className="font-medium">{config.announcePageChanges ? '✅ Enabled' : '❌ Disabled'}</span>
            </div>
            <div className="flex justify-between">
              <span>Screen Reader Mode:</span>
              <span className="font-medium">{config.screenReaderMode ? '✅ Enabled' : '❌ Disabled'}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3 text-yellow-900 dark:text-yellow-100">
            How to Test
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-yellow-800 dark:text-yellow-200">
            <li>Check the platform detection above - it should show your operating system</li>
            <li>The modifier key should show "Cmd" on Mac, "Ctrl" on Windows/Linux</li>
            <li>Try pressing the keyboard shortcuts listed above</li>
            <li>The "Key Press Detector" will show what you're actually pressing</li>
            <li>Click the accessibility button (bottom-right corner) to adjust settings</li>
            <li>Open browser console (F12) to see debug logs when shortcuts are pressed</li>
          </ol>
        </div>

        {/* Troubleshooting */}
        <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3 text-red-900 dark:text-red-100">
            Troubleshooting
          </h2>
          <ul className="list-disc list-inside space-y-2 text-red-800 dark:text-red-200">
            <li><strong>Mac:</strong> If Cmd+H minimizes window, use Cmd+D instead for testing</li>
            <li><strong>Windows:</strong> If Alt shortcuts open menus, try in a different browser</li>
            <li><strong>Shortcuts not working:</strong> Make sure "Keyboard Shortcuts" is enabled in accessibility settings</li>
            <li><strong>Wrong platform detected:</strong> Check the User Agent string above and report the issue</li>
            <li><strong>Open Browser Console (F12):</strong> See detailed debug information when shortcuts are pressed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
