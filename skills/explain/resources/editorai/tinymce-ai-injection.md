---
topic: tinymce-ai-injection
description: Inject custom AI shortcuts into Expert's TinyMCE editor via template script — confirmed working, supports site-managed guidelines
group: editorai
---

## tinymce-ai-injection — Custom AI Shortcuts via Template Script

Expert's EditorAI uses the TinyMCE `ai` plugin. The `ai_shortcuts` option is not exposed in tenant settings, but can be extended via a script tag injected through the Expert template system.

### Why this works

TinyMCE plugin registration is **lazy** — all plugins (including `ai`) register when the editor opens, not on page load. A script injected into the page header runs before the editor is opened, giving a window to monkey-patch `tinymce.PluginManager.add`.

### Why `editor.options.register` must be intercepted

`ai_shortcuts` is registered inside the plugin's `init` function. Calling `editor.options.set('ai_shortcuts', ...)` before `init` runs throws "ai_shortcuts is not a registered option". The fix is to wrap `editor.options.register` and set the value immediately after the option is registered, before the plugin reads it to build the shortcuts menu.

---

## Pattern A — Static shortcuts (hardcoded)

Use when shortcuts are fixed and don't need to be managed by content authors.

```html
<script>/*<![CDATA[*/
(function() {
  function patch() {
    if (!window.tinymce) { setTimeout(patch, 50); return; }
    tinymce.PluginManager.add = (function(_add) {
      return function(name, init) {
        if (name === 'ai') {
          return _add(name, function(editor, url) {
            var _register = editor.options.register.bind(editor.options);
            editor.options.register = function(optionName, config) {
              var result = _register(optionName, config);
              if (optionName === 'ai_shortcuts') {
                var defaults = editor.options.get('ai_shortcuts') || [];
                editor.options.set('ai_shortcuts', defaults.concat([{
                  title: 'House style',
                  subprompts: [
                    { title: 'Active voice', prompt: 'Rewrite this content using active voice throughout, removing passive constructions.', selection: true },
                    { title: 'Plain language', prompt: 'Rewrite this content avoiding jargon and keeping sentences under 25 words.', selection: true },
                    { title: 'Direct address', prompt: 'Rewrite this content addressing the reader directly as "you" throughout.', selection: true }
                  ]
                }]));
              }
              return result;
            };
            return init(editor, url);
          });
        }
        return _add(name, init);
      };
    }(tinymce.PluginManager.add.bind(tinymce.PluginManager)));
  }
  patch();
})();
/*]]>*/</script>
```

---

## Pattern B — Site-managed shortcuts (dynamic, fetched from an Expert page)

Use when content authors should be able to manage shortcuts without a code deployment. Guidelines live as a normal Expert page — each H2 section becomes a shortcut subprompt.

### How it works

1. Create a guidelines page (e.g. `StyleGuide/AIPrompts`) with H2 sections and paragraph descriptions
2. The template script fetches the page contents via the Deki API on page load
3. Each H2 + paragraph is parsed into a shortcut entry
4. Shortcuts are injected when the editor opens

DekiScript **cannot** be used to inline this content into the `<head>` — DekiScript only evaluates in the page body template, not the HTML head. The client-side fetch is required.

### Guidelines page format

Create an Expert page at `StyleGuide/AIPrompts` (or any path — update `GUIDELINES_PATH` to match). Author it as normal wiki content:

```
## Public Facing Content
Write using a warm, friendly tone. Over-explain topics and use markdown to make content quickly consumable.

## Internal Content
Short, sharp, and to the point. Clear and concise — readable but not fluffy.
```

Each H2 becomes a subprompt title. The paragraph text becomes the style instruction appended to the prompt.

### Template script

```html
<script>/*<![CDATA[*/
(function() {
  var GUIDELINES_PATH = 'StyleGuide/AIPrompts';
  var _shortcuts = null;

  (function fetchGuidelines() {
    var settings;
    try {
      settings = JSON.parse(document.getElementById('mt-global-settings').textContent);
    } catch(e) { return; }

    var path = '/@api/deki/pages/=' + encodeURIComponent(GUIDELINES_PATH) + '/contents?dream.out.format=json';
    fetch(path, {
      credentials: 'include',
      headers: { 'x-deki-token': settings.apiToken }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var html = Array.isArray(data.body) ? data.body[0] : data.body;
      if (typeof html !== 'string') return;

      var div = document.createElement('div');
      div.innerHTML = html;

      var shortcuts = [];
      div.querySelectorAll('.mt-section').forEach(function(section) {
        var heading = section.querySelector('h2');
        var paras = section.querySelectorAll('p');
        if (!heading) return;

        var title = heading.textContent.trim();
        var guidelines = Array.from(paras)
          .map(function(p) { return p.textContent.trim(); })
          .filter(function(t) { return t.length > 0; })
          .join(' ');
        if (!guidelines) return;

        shortcuts.push({
          title: title,
          prompt: 'Rewrite this content following these style guidelines: ' + guidelines,
          selection: true
        });
      });

      if (shortcuts.length) _shortcuts = shortcuts;
    })
    .catch(function(e) { console.warn('AI guidelines fetch failed:', e); });
  })();

  function patch() {
    if (!window.tinymce) { setTimeout(patch, 50); return; }
    tinymce.PluginManager.add = (function(_add) {
      return function(name, init) {
        if (name === 'ai') {
          return _add(name, function(editor, url) {
            var _register = editor.options.register.bind(editor.options);
            editor.options.register = function(optionName, config) {
              var result = _register(optionName, config);
              if (optionName === 'ai_shortcuts' && _shortcuts) {
                var defaults = editor.options.get('ai_shortcuts') || [];
                editor.options.set('ai_shortcuts', defaults.concat([{
                  title: 'House style',
                  subprompts: _shortcuts
                }]));
              }
              return result;
            };
            return init(editor, url);
          });
        }
        return _add(name, init);
      };
    }(tinymce.PluginManager.add.bind(tinymce.PluginManager)));
  }
  patch();
})();
/*]]>*/</script>
```

### API response structure (confirmed)

`GET /@api/deki/pages/={encoded-path}/contents?dream.out.format=json` returns:

```json
{
  "body": [
    "<html string of page content>",
    { "@target": "toc", "#text": "<toc html>" }
  ]
}
```

`data.body[0]` is the HTML string. Sections are `<div class="mt-section">` with an `<h2>` heading.

---

## Shortcut data structure

Flat entry:
```json
{ "title": "My prompt", "prompt": "Do something to this content.", "selection": true }
```

Nested dropdown:
```json
{
  "title": "Group name",
  "subprompts": [
    { "title": "Sub-option", "prompt": "Do something specific.", "selection": true }
  ]
}
```

`selection: true` means the prompt operates on the current text selection.

---

## Constraints

- **`ai_request` is hardcoded** in `pro.js` via `ml(this.martianSettings)` — it cannot be overridden without modifying Expert's bundle. All requests go to `@api/deki/llm/editor/completions`.
- **`isEditorAiAssistantShortcutsEnabled`** in `mt-global-settings` controls whether the shortcuts menu button appears in the toolbar. If `false`, Expert hides the button regardless of the `ai_shortcuts` option value. Verify this flag is `true` in the tenant before deploying.
- The `predefined` role message sent with every completion request is hardcoded — tenant-specific system prompt injection is not possible via this route.
- DekiScript does not evaluate in the HTML `<head>` — only in the page body template. Client-side fetch is required for dynamic content.

---

## Verification

To confirm the injection window is open on a given page, paste in the console before opening the editor:

```js
const _add = tinymce.PluginManager.add.bind(tinymce.PluginManager);
tinymce.PluginManager.add = function(name, init) {
  console.log('PluginManager.add called:', name);
  return _add(name, init);
};
```

Then open the editor. If `PluginManager.add called: ai` logs, the injection window is open.
