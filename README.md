# DAWG Search
[![npm version][npm-version-src]][npm-href]
[![npm downloads][npm-downloads-src]][npm-href]
[![Unit Test][unit-test-src]][unit-test-href]
[![License][license-src]][license-href]

## Description
- It aims at solving a string searching problem: how to find **many** words in **one** text.
- It's designed to work with non-English languages like Chinese and Japanese.
- It's based on two well-studied data strucutres: Trie Automaton and Suffix Automaton
- If multiple words overlaps, words shown first or longer take precedence,

## Install

```bash
npm i dawg-search
```

## Usage

```js
import { prepareSearch, refineMatches } from 'dawg-search'

const text = '举头望明月，低头思故乡'
const words = ['明月', '故乡', '月，低']

const { findWords } = prepareSearch(words)
const results = refineMatches(findWords(text))

// [{start: 3, end: 5}, {start: 9, end: 11}]

```

## How it works
1. Trie Automaton  
First you need to prepare a dictionary of words.
It will be processed into a trie, which merged not only the prefixes but also the suffixes.  
Historically it's called *Deterministic Acyclic Finite State Automaton* (DAFSA).
(A regular trie will work, but considering many words have common suffix, it could save a lot of memory).

2. Suffix Automaton 
When searching text, the text is processed into a suffix automaton. The trie automaton can be reused.

3. Traversing Phase  
Then, from root node of the suffix automaton, it will traverse every transition,
which implicitly will traverse all substrings.  
It runs in two pass,  
`findWords` return results in unordered list,  
`refineMatches` will sort and eliminate overlaps.

## Limitations
- This lib can only process concrete words, not regex.
- For the two data structures, a long chain of single transitions could be compressed into one transition, achieving more compact forms. 

## License
[MIT](./LICENSE) License © 2026 [UnluckyNinja](https://github.com/UnluckyNinja)

[npm-version-src]: https://img.shields.io/npm/v/dawg-search?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-src]: https://img.shields.io/npm/dm/dawg-search?style=flat&colorA=080f12&colorB=1fa669
[npm-href]: https://npmjs.com/package/dawg-search
[unit-test-src]: https://github.com/UnluckyNinja/dawg-search/actions/workflows/unit-test.yml/badge.svg
[unit-test-href]: https://github.com/UnluckyNinja/dawg-search/actions/workflows/unit-test.yml
[license-src]: https://img.shields.io/github/license/UnluckyNinja/dawg-search.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/UnluckyNinja/dawg-search/blob/main/LICENSE