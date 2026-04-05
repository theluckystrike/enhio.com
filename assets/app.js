/* Text Enhancement Tool - enhio.com */
(function() {
  'use strict';

  var stopWords = new Set(['the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at','this','but','his','by','from','they','we','her','she','or','an','will','my','one','all','would','there','their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us']);

  function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 2) return word.length > 0 ? 1 : 0;
    var count = 0;
    var vowels = 'aeiouy';
    var prevVowel = false;
    for (var i = 0; i < word.length; i++) {
      var isVowel = vowels.indexOf(word[i]) !== -1;
      if (isVowel && !prevVowel) count++;
      prevVowel = isVowel;
    }
    // Adjust for silent e
    if (word.length > 2 && word[word.length - 1] === 'e' && vowels.indexOf(word[word.length - 2]) === -1) {
      count = Math.max(1, count - 1);
    }
    return Math.max(1, count);
  }

  function getSentences(text) {
    var sentences = text.split(/[.!?]+/).filter(function(s) {
      return s.trim().length > 0;
    });
    return sentences;
  }

  function getWords(text) {
    return text.split(/\s+/).filter(function(w) {
      return w.replace(/[^a-zA-Z0-9]/g, '').length > 0;
    });
  }

  function getParagraphs(text) {
    return text.split(/\n\s*\n/).filter(function(p) {
      return p.trim().length > 0;
    });
  }

  function analyze(text) {
    if (!text.trim()) {
      clearResults();
      return;
    }
    var words = getWords(text);
    var sentences = getSentences(text);
    var paragraphs = getParagraphs(text);
    var charCount = text.length;
    var charNoSpaces = text.replace(/\s/g, '').length;
    var wordCount = words.length;
    var sentenceCount = sentences.length;
    var paragraphCount = paragraphs.length;
    var readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Syllable count
    var totalSyllables = 0;
    for (var i = 0; i < words.length; i++) {
      totalSyllables += countSyllables(words[i]);
    }

    // Flesch-Kincaid Grade Level
    var fkGrade = 0;
    var fleschEase = 0;
    if (wordCount > 0 && sentenceCount > 0) {
      fkGrade = 0.39 * (wordCount / sentenceCount) + 11.8 * (totalSyllables / wordCount) - 15.59;
      fkGrade = Math.max(0, Math.round(fkGrade * 10) / 10);
      fleschEase = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (totalSyllables / wordCount);
      fleschEase = Math.max(0, Math.min(100, Math.round(fleschEase * 10) / 10));
    }

    // Update basic stats
    document.getElementById('word-count').textContent = wordCount;
    document.getElementById('char-count').textContent = charCount;
    document.getElementById('sentence-count').textContent = sentenceCount;
    document.getElementById('paragraph-count').textContent = paragraphCount;
    document.getElementById('reading-time').textContent = readingTime + ' min';
    document.getElementById('syllable-count').textContent = totalSyllables;

    // Readability
    renderReadability(fkGrade, fleschEase);

    // Word frequency
    renderWordFrequency(words);

    // Sentence length distribution
    renderSentenceDistribution(sentences);

    // Tone analysis
    renderTone(text, words, sentences);

    // Suggestions
    renderSuggestions(text, words, sentences);
  }

  function clearResults() {
    var ids = ['word-count','char-count','sentence-count','paragraph-count','reading-time','syllable-count'];
    for (var i = 0; i < ids.length; i++) document.getElementById(ids[i]).textContent = '0';
    document.getElementById('readability-section').innerHTML = '';
    document.getElementById('frequency-section').innerHTML = '';
    document.getElementById('distribution-section').innerHTML = '';
    document.getElementById('tone-section').innerHTML = '';
    document.getElementById('suggestions-section').innerHTML = '';
  }

  function renderReadability(grade, ease) {
    var gradeLabel = grade <= 6 ? 'Easy' : grade <= 10 ? 'Moderate' : grade <= 14 ? 'Difficult' : 'Very Difficult';
    var easeLabel = ease >= 70 ? 'Easy' : ease >= 50 ? 'Moderate' : ease >= 30 ? 'Difficult' : 'Very Difficult';
    var gradeColor = grade <= 8 ? '#34D399' : grade <= 12 ? '#FBBF24' : '#F87171';
    var easeColor = ease >= 60 ? '#34D399' : ease >= 40 ? '#FBBF24' : '#F87171';

    document.getElementById('readability-section').innerHTML =
      '<div class="readability-grid">' +
      '<div class="readability-item"><div class="score" style="color:' + gradeColor + '">' + grade + '</div>' +
      '<div class="desc">Flesch-Kincaid Grade Level (' + gradeLabel + ')</div>' +
      '<div class="score-bar"><div class="score-bar-fill" style="width:' + Math.min(100, grade * 5) + '%;background:' + gradeColor + '"></div></div></div>' +
      '<div class="readability-item"><div class="score" style="color:' + easeColor + '">' + ease + '</div>' +
      '<div class="desc">Flesch Reading Ease (' + easeLabel + ')</div>' +
      '<div class="score-bar"><div class="score-bar-fill" style="width:' + ease + '%;background:' + easeColor + '"></div></div></div>' +
      '</div>';
  }

  function renderWordFrequency(words) {
    var freq = {};
    for (var i = 0; i < words.length; i++) {
      var w = words[i].toLowerCase().replace(/[^a-z']/g, '');
      if (w.length < 2 || stopWords.has(w)) continue;
      freq[w] = (freq[w] || 0) + 1;
    }
    var sorted = Object.keys(freq).map(function(k) { return { word: k, count: freq[k] }; });
    sorted.sort(function(a, b) { return b.count - a.count; });
    sorted = sorted.slice(0, 20);

    if (sorted.length === 0) {
      document.getElementById('frequency-section').innerHTML = '<p style="color:var(--text-muted)">Not enough content to analyze.</p>';
      return;
    }

    var maxCount = sorted[0].count;
    var html = '<ul class="freq-list">';
    for (var j = 0; j < sorted.length; j++) {
      var pct = (sorted[j].count / maxCount) * 100;
      html += '<li class="freq-item"><span class="freq-word">' + sorted[j].word + '</span>' +
        '<div class="freq-bar" style="width:' + Math.max(5, pct) + '%"><span class="freq-count">' + sorted[j].count + '</span></div></li>';
    }
    html += '</ul>';
    document.getElementById('frequency-section').innerHTML = html;
  }

  function renderSentenceDistribution(sentences) {
    var short = 0, medium = 0, long = 0;
    for (var i = 0; i < sentences.length; i++) {
      var wc = getWords(sentences[i]).length;
      if (wc <= 10) short++;
      else if (wc <= 25) medium++;
      else long++;
    }
    var total = sentences.length || 1;
    var sp = Math.round(short / total * 100);
    var mp = Math.round(medium / total * 100);
    var lp = Math.round(long / total * 100);

    document.getElementById('distribution-section').innerHTML =
      '<div class="dist-row">' +
      '<div class="dist-item"><div class="dist-dot" style="background:#34D399"></div><span class="dist-label">Short (&le;10 words)</span><span class="dist-pct">' + sp + '%</span></div>' +
      '<div class="dist-item"><div class="dist-dot" style="background:#FBBF24"></div><span class="dist-label">Medium (11-25)</span><span class="dist-pct">' + mp + '%</span></div>' +
      '<div class="dist-item"><div class="dist-dot" style="background:#F87171"></div><span class="dist-label">Long (25+)</span><span class="dist-pct">' + lp + '%</span></div>' +
      '</div>';
  }

  function renderTone(text, words, sentences) {
    // Formal vs Casual indicators
    var contractions = (text.match(/\b\w+'\w+/g) || []).length;
    var avgSentLen = words.length / Math.max(1, sentences.length);
    var longWords = 0;
    for (var i = 0; i < words.length; i++) {
      if (countSyllables(words[i]) >= 3) longWords++;
    }
    var complexPct = words.length > 0 ? longWords / words.length : 0;
    var contractionRate = words.length > 0 ? contractions / words.length : 0;

    // Score: 0 = very casual, 100 = very formal
    var formalScore = 50;
    formalScore += (avgSentLen - 15) * 1.5; // longer sentences = more formal
    formalScore += complexPct * 40; // more complex words = more formal
    formalScore -= contractionRate * 100; // contractions = more casual
    formalScore = Math.max(0, Math.min(100, Math.round(formalScore)));

    var toneLabel = formalScore >= 70 ? 'Formal' : formalScore >= 40 ? 'Neutral' : 'Casual';

    document.getElementById('tone-section').innerHTML =
      '<div class="tone-meter">' +
      '<span class="tone-label">Casual</span>' +
      '<div class="tone-bar-track"><div class="tone-bar-indicator" style="left:calc(' + formalScore + '% - 8px)"></div></div>' +
      '<span class="tone-label" style="text-align:right">Formal</span>' +
      '</div>' +
      '<p style="text-align:center;color:var(--text-muted);font-size:0.9rem;">Tone: <strong style="color:var(--accent)">' + toneLabel + '</strong> (score: ' + formalScore + '/100)</p>';
  }

  function renderSuggestions(text, words, sentences) {
    var suggestions = [];

    // Long sentences
    for (var i = 0; i < sentences.length; i++) {
      var wc = getWords(sentences[i]).length;
      if (wc > 40) {
        var preview = sentences[i].trim().substring(0, 60) + '...';
        suggestions.push({ type: 'Long Sentence', msg: '"' + preview + '" has ' + wc + ' words. Consider breaking it into shorter sentences.' });
      }
    }

    // Passive voice detection (simple: was/were + past participle pattern)
    var passiveRegex = /\b(was|were|is|are|been|being)\s+(\w+ed|written|spoken|taken|given|made|done|shown|known|gone|seen)\b/gi;
    var passiveMatches = text.match(passiveRegex);
    if (passiveMatches) {
      var shown = Math.min(3, passiveMatches.length);
      for (var j = 0; j < shown; j++) {
        suggestions.push({ type: 'Passive Voice', msg: 'Found "' + passiveMatches[j] + '". Consider using active voice for more direct writing.' });
      }
      if (passiveMatches.length > 3) {
        suggestions.push({ type: 'Passive Voice', msg: passiveMatches.length + ' passive voice instances detected total. Aim for mostly active voice.' });
      }
    }

    // Overused words
    var freq = {};
    for (var k = 0; k < words.length; k++) {
      var w = words[k].toLowerCase().replace(/[^a-z']/g, '');
      if (w.length < 3 || stopWords.has(w)) continue;
      freq[w] = (freq[w] || 0) + 1;
    }
    var threshold = Math.max(4, words.length * 0.02);
    var overused = Object.keys(freq).filter(function(w) { return freq[w] >= threshold; });
    for (var l = 0; l < Math.min(3, overused.length); l++) {
      suggestions.push({ type: 'Overused Word', msg: '"' + overused[l] + '" appears ' + freq[overused[l]] + ' times. Consider using synonyms for variety.' });
    }

    // No suggestions
    if (suggestions.length === 0 && words.length > 10) {
      suggestions.push({ type: 'Looking Good', msg: 'No major issues detected. Your text reads well.' });
    }

    var html = '<ul class="suggestions-list">';
    for (var m = 0; m < suggestions.length; m++) {
      html += '<li><div class="type">' + suggestions[m].type + '</div>' + suggestions[m].msg + '</li>';
    }
    html += '</ul>';
    document.getElementById('suggestions-section').innerHTML = html;
  }

  var debounceTimer;
  document.addEventListener('DOMContentLoaded', function() {
    var textarea = document.getElementById('text-input');
    textarea.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() { analyze(textarea.value); }, 200);
    });
  });
})();
