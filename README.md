# word search

## Description
- It aims at solving a string searching problem: how to find **many** words in **one** text.
- It's designed to work with non-English languages like Chinese and Japanese.
- It's based on two well-studied data strucutres: DAFSA and Suffix Automaton
- If multiple words overlaps, words shown first or longer take precedence,

## How it works
1. DAFSA Phase  
First you need to prepare a dictionary of words.
It will be processed into a trie, which merged not only the prefixes but also the suffixes.  
Historically it's called *Deterministic Acyclic Finite State Automaton* (DAFSA).
(A regular trie will work, but considering many words have common suffix, it could save a lot of memory).

2. Suffix Phase  
Secondly, the text to be searched in is processed into a suffix automaton.

3. Traversing Phase  
Then, from root node of the suffix automaton, it will traverse every transition,
which implicitly will traverse all substrings.  
A naive implementation will reveal two issues:
    1. Until the terminal state, the pointer wouldn't know where the matched word starts and ends.
    2. Matches can overlap with each other.
    e.g.
    ```
    ... underground ...
        under
             ground
        underground
    ```

## Room for improvement
- This lib can only process concrete words, not regex.
- For the two data structures, a long chain of single transitions can be compressed into one transition, achiving more compact forms. 
Though technically feasible (not verified), integrate the two would introduce far more work than current implementation.

## License
2026 MIT License