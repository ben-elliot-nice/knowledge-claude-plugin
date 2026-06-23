---
topic: dekiscript-gotchas
description: DekiScript runtime gotchas — lazy types, foreach scoping, missing functions, and XML literal restrictions
group: dekiscript
---

## dekiscript-gotchas — Runtime Gotchas

These behaviours are not documented in Expert's official DekiScript reference. Each causes silent wrong results, not thrown errors — code appears to run but produces empty output.

---

### Lazy types — page.tags values fail string operations

`map.keys(page.tags)` and `map.values(page.tags)` return lazy-typed objects. They render correctly as XML content (`<p>tag</p>` outputs the tag string) but silently fail with all string operations:

```dekiscript
// ALL of these return empty / false on a page.tags value:
string.substr(t.value, 0, 5)           // → ""
string.startswith(t.value, "prefix:")  // → false
"prefix:" & t.value                    // → ""
string.replace(t.value, "x", "y")     // → lazy object — still won't concatenate
```

**Workaround — use `string.join` to force serialisation:**

```dekiscript
var tagStr = string.join(map.keys(page.tags), "|");
var tags = string.split(tagStr, "|");
// tags is now a list of real strings — string.contains and string.replace work
```

`string.replace` return values are also lazy. To concatenate a replace result, wrap it again:

```dekiscript
var slug = string.replace(tag, "version-set:", "");
// "prefix:" & slug          → empty (lazy)
// string.join(["prefix:", slug], "")  → works
```

See `dekiscript-page-object` for the full `page.tags` API.

---

### foreach scoping — outer variable mutation does not persist

Variables declared before a `foreach` block cannot be updated from inside it. Assignments inside the block shadow the outer binding; the outer variable is unchanged when the loop exits.

```dekiscript
var slug = "";
foreach (var tag in tags) {
  if (string.contains(tag, "version-set:")) {
    slug = string.replace(tag, "version-set:", "");  // does NOT propagate
  }
}
// slug is still "" here
```

**Workaround — do all dependent work inside the foreach where the match is found:**

```dekiscript
foreach (var tag in tags) {
  if (string.contains(tag, "version-set:")) {
    var slug = string.join(["", string.replace(tag, "version-set:", "")], "");
    // use slug here — render output, call wiki.getsearch, etc.
  }
}
```

There is no way to extract a value from a foreach block into an outer variable.

---

### list.append does not exist

DekiScript has no `list.append` or equivalent mutable-list function. Accumulating results across iterations is not possible.

```dekiscript
list.append(myList, item)  // TypeError: cannot convert from NIL to FUNC
```

Because foreach scoping also prevents outer variable mutation, there is no way to build a sorted list of values derived from `page.tags` inside a foreach. If ordered output is required, filter and query outside the loop using `wiki.getsearch` with a tag filter.

---

### Multi-word string literals in XML content require a variable

Writing a multi-word literal directly into XML content produces a ParseError:

```dekiscript
// WRONG — ParseError: invalid XmlNode
<p>Document Versions</p>;

// CORRECT
var label = "Document Versions";
<p>label</p>;
```

Single-word literals are fine inline. Any string with spaces must be assigned to a variable first.

---

### string.substr index 0 returns empty

`string.substr(str, 0, n)` returns empty string — index 0 appears to be treated as nil/invalid. Use 1-based indexing or avoid `substr` for prefix matching:

```dekiscript
// Unreliable — returns empty
string.substr(str, 0, 12)

// Preferred — use string.contains + string.replace for prefix work
if (string.contains(tag, "version-set:")) {
  var slug = string.replace(tag, "version-set:", "");
}
```

---

### wiki.api requires a URI type, not a string

`wiki.api()` accepts a URI type, not a plain string. Constructing a URI by concatenating a string path produces a TypeError at call time.

```dekiscript
// WRONG — TypeError: invalid type for parameter 'source'; cannot convert from STR to URI
wiki.api("/pages/" & page.id & "/tags")

// CORRECT — site.api is already a URI; URI & string produces a URI
wiki.api(site.api & "pages/" & page.id & "/tags")
```

`site.api` is the base API URI (e.g. `https://instance.mindtouch.us/@api/deki/`). Concatenating a string onto a URI produces a URI, so start with `site.api`.

Note: integer `page.id` may not interpolate into a URI string correctly in all DekiScript versions — verify on the target instance.
