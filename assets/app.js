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

  /* --- SEO Analysis --- */

  function analyzeSEO(text, keyword) {
    var container = document.getElementById('seo-results');
    if (!container || !text.trim() || !keyword.trim()) {
      if (container) container.style.display = 'none';
      return;
    }
    container.style.display = 'block';
    var words = getWords(text);
    var wordCount = words.length;
    var lowerText = text.toLowerCase();
    var lowerKeyword = keyword.toLowerCase().trim();
    var score = 0;
    var checks = [];

    // Keyword in first 100 words
    var first100 = words.slice(0, 100).join(' ').toLowerCase();
    var inFirst100 = first100.indexOf(lowerKeyword) !== -1;
    if (inFirst100) { score += 20; checks.push({ pass: true, msg: 'Keyword found in first 100 words' }); }
    else { checks.push({ pass: false, msg: 'Keyword NOT in first 100 words — add it to your introduction' }); }

    // Keyword density
    var kwWords = lowerKeyword.split(/\s+/).length;
    var kwCount = 0;
    var searchFrom = 0;
    for (var i = 0; i < 1000; i++) {
      var idx = lowerText.indexOf(lowerKeyword, searchFrom);
      if (idx === -1) break;
      kwCount++;
      searchFrom = idx + 1;
    }
    var density = wordCount > 0 ? (kwCount * kwWords / wordCount) * 100 : 0;
    if (density >= 1 && density <= 3) {
      score += 25;
      checks.push({ pass: true, msg: 'Keyword density: ' + density.toFixed(1) + '% (optimal: 1-3%)' });
    } else if (density > 0) {
      score += 10;
      checks.push({ pass: false, msg: 'Keyword density: ' + density.toFixed(1) + '% (' + (density < 1 ? 'too low, aim for 1-3%' : 'too high, may look spammy') + ')' });
    } else {
      checks.push({ pass: false, msg: 'Keyword not found in text at all' });
    }

    // Word count check
    if (wordCount >= 1500 && wordCount <= 2500) {
      score += 25;
      checks.push({ pass: true, msg: 'Word count: ' + wordCount + ' (optimal range: 1500-2500 for ranking)' });
    } else if (wordCount >= 800) {
      score += 15;
      checks.push({ pass: false, msg: 'Word count: ' + wordCount + ' (aim for 1500-2500 for best ranking potential)' });
    } else {
      score += 5;
      checks.push({ pass: false, msg: 'Word count: ' + wordCount + ' (too short — aim for 1500+ words)' });
    }

    // Headings check (H tags if HTML)
    var hasHeadings = /<h[1-6]/i.test(text);
    if (hasHeadings) {
      score += 10;
      checks.push({ pass: true, msg: 'HTML headings detected' });
    }

    // Readability bonus
    var sentences = getSentences(text);
    var totalSyllables = 0;
    for (var s = 0; s < words.length; s++) totalSyllables += countSyllables(words[s]);
    var sentenceCount = Math.max(1, sentences.length);
    var fkGrade = 0.39 * (wordCount / sentenceCount) + 11.8 * (totalSyllables / Math.max(1, wordCount)) - 15.59;
    fkGrade = Math.max(0, Math.round(fkGrade * 10) / 10);
    if (fkGrade >= 6 && fkGrade <= 10) {
      score += 20;
      checks.push({ pass: true, msg: 'Readability grade ' + fkGrade + ' (good for SEO: 6-10)' });
    } else {
      score += 5;
      checks.push({ pass: false, msg: 'Readability grade ' + fkGrade + ' (aim for 6-10 for best SEO)' });
    }

    score = Math.min(100, score);
    var scoreColor = score >= 70 ? '#34D399' : score >= 40 ? '#FBBF24' : '#F87171';

    var html = '<h3>SEO Readiness Score</h3>';
    html += '<div class="seo-score" style="text-align:center;margin-bottom:20px;">';
    html += '<div style="font-family:var(--font-display);font-size:3rem;font-weight:700;color:' + scoreColor + '">' + score + '</div>';
    html += '<div style="font-size:0.85rem;color:var(--text-muted);">out of 100</div>';
    html += '<div class="score-bar" style="max-width:300px;margin:8px auto 0;"><div class="score-bar-fill" style="width:' + score + '%;background:' + scoreColor + '"></div></div>';
    html += '</div>';
    html += '<ul class="suggestions-list">';
    for (var c = 0; c < checks.length; c++) {
      var icon = checks[c].pass ? '<span style="color:#34D399">PASS</span>' : '<span style="color:#F87171">FAIL</span>';
      html += '<li><div class="type">' + icon + '</div>' + checks[c].msg + '</li>';
    }
    html += '</ul>';
    container.innerHTML = html;
  }

  /* --- Side-by-Side Compare --- */

  function compareTexts(textA, textB) {
    var container = document.getElementById('compare-results');
    if (!container || !textA.trim() || !textB.trim()) {
      if (container) container.style.display = 'none';
      return;
    }
    container.style.display = 'block';

    var wordsA = getWords(textA), wordsB = getWords(textB);
    var sentA = getSentences(textA), sentB = getSentences(textB);
    var syllA = 0, syllB = 0;
    for (var i = 0; i < wordsA.length; i++) syllA += countSyllables(wordsA[i]);
    for (var j = 0; j < wordsB.length; j++) syllB += countSyllables(wordsB[j]);

    var gradeA = wordsA.length > 0 && sentA.length > 0 ? 0.39 * (wordsA.length / sentA.length) + 11.8 * (syllA / wordsA.length) - 15.59 : 0;
    var gradeB = wordsB.length > 0 && sentB.length > 0 ? 0.39 * (wordsB.length / sentB.length) + 11.8 * (syllB / wordsB.length) - 15.59 : 0;
    gradeA = Math.max(0, Math.round(gradeA * 10) / 10);
    gradeB = Math.max(0, Math.round(gradeB * 10) / 10);

    var easeA = wordsA.length > 0 && sentA.length > 0 ? 206.835 - 1.015 * (wordsA.length / sentA.length) - 84.6 * (syllA / wordsA.length) : 0;
    var easeB = wordsB.length > 0 && sentB.length > 0 ? 206.835 - 1.015 * (wordsB.length / sentB.length) - 84.6 * (syllB / wordsB.length) : 0;
    easeA = Math.max(0, Math.min(100, Math.round(easeA * 10) / 10));
    easeB = Math.max(0, Math.min(100, Math.round(easeB * 10) / 10));

    var avgSentA = sentA.length > 0 ? Math.round(wordsA.length / sentA.length * 10) / 10 : 0;
    var avgSentB = sentB.length > 0 ? Math.round(wordsB.length / sentB.length * 10) / 10 : 0;

    var gradeDiff = Math.abs(gradeA - gradeB).toFixed(1);
    var easier = gradeA < gradeB ? 'A' : gradeA > gradeB ? 'B' : 'equal';

    var html = '<h3>Side-by-Side Comparison</h3>';
    html += '<table class="compare-table"><thead><tr><th>Metric</th><th>Version A</th><th>Version B</th><th>Delta</th></tr></thead><tbody>';
    html += buildCompareRow('Words', wordsA.length, wordsB.length);
    html += buildCompareRow('Sentences', sentA.length, sentB.length);
    html += buildCompareRow('Avg Sentence Length', avgSentA, avgSentB);
    html += buildCompareRow('FK Grade Level', gradeA, gradeB);
    html += buildCompareRow('Flesch Reading Ease', easeA, easeB);
    html += buildCompareRow('Syllables', syllA, syllB);
    html += '</tbody></table>';

    if (easier !== 'equal') {
      html += '<p class="compare-verdict">Version ' + easier + ' is <strong style="color:var(--accent)">' + gradeDiff + ' grade levels easier</strong> to read than Version ' + (easier === 'A' ? 'B' : 'A') + '.</p>';
    } else {
      html += '<p class="compare-verdict">Both versions have the <strong style="color:var(--accent)">same readability level</strong>.</p>';
    }
    container.innerHTML = html;
  }

  function buildCompareRow(label, valA, valB) {
    var delta = (typeof valA === 'number' && typeof valB === 'number') ? (valA - valB) : 0;
    var deltaStr = delta > 0 ? '+' + delta.toFixed(1) : delta.toFixed(1);
    var deltaColor = delta === 0 ? 'var(--text-muted)' : delta > 0 ? '#34D399' : '#F87171';
    return '<tr><td style="font-weight:600;">' + label + '</td><td>' + valA + '</td><td>' + valB + '</td><td style="color:' + deltaColor + ';font-family:var(--font-display)">' + deltaStr + '</td></tr>';
  }

  /* --- Mode Switching --- */

  var debounceTimer, seoTimer, compareTimer;

  document.addEventListener('DOMContentLoaded', function() {
    var textarea = document.getElementById('text-input');
    textarea.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() { analyze(textarea.value); }, 200);
    });

    var seoText = document.getElementById('seo-text-input');
    var seoKw = document.getElementById('seo-keyword');
    if (seoText && seoKw) {
      var seoHandler = function() {
        clearTimeout(seoTimer);
        seoTimer = setTimeout(function() { analyzeSEO(seoText.value, seoKw.value); }, 300);
      };
      seoText.addEventListener('input', seoHandler);
      seoKw.addEventListener('input', seoHandler);
    }

    var compA = document.getElementById('compare-a');
    var compB = document.getElementById('compare-b');
    if (compA && compB) {
      var compHandler = function() {
        clearTimeout(compareTimer);
        compareTimer = setTimeout(function() { compareTexts(compA.value, compB.value); }, 300);
      };
      compA.addEventListener('input', compHandler);
      compB.addEventListener('input', compHandler);
    }
  });
})();

function enhioSwitchMode(mode) {
  var modes = ['analyze', 'seo', 'compare'];
  for (var i = 0; i < modes.length; i++) {
    var el = document.getElementById('mode-' + modes[i]);
    if (el) el.style.display = modes[i] === mode ? 'block' : 'none';
  }
  // Show/hide existing analysis sections when in analyze mode
  var analysisSections = document.querySelectorAll('.stats-grid, .analysis-section:not(#seo-results):not(#compare-results)');
  for (var j = 0; j < analysisSections.length; j++) {
    analysisSections[j].style.display = mode === 'analyze' ? '' : 'none';
  }
  var tabs = document.querySelectorAll('.mode-tab');
  for (var k = 0; k < tabs.length; k++) {
    tabs[k].classList.toggle('active', tabs[k].getAttribute('data-mode') === mode);
  }
}


// === Zovo V5 Pro Nudge System ===
(function() {
  var V5_LIMIT = 3;
  var V5_FEATURE = 'Advanced readability metrics';
  var v5Count = 0;
  var v5Shown = false;

  function v5ShowNudge() {
    if (v5Shown || sessionStorage.getItem('v5_pro_nudge')) return;
    v5Shown = true;
    sessionStorage.setItem('v5_pro_nudge', '1');
    var host = location.hostname;
    var el = document.createElement('div');
    el.className = 'pro-nudge';
    el.innerHTML = '<div class="pro-nudge-inner">' +
      '<span class="pro-nudge-icon">\u2726</span>' +
      '<div class="pro-nudge-text">' +
      '<strong>' + V5_FEATURE + '</strong> is a Pro feature. ' +
      '<a href="https://zovo.one/pricing?utm_source=' + host +
      '&utm_medium=satellite&utm_campaign=pro-nudge" target="_blank">' +
      'Get Zovo Lifetime \u2014 $99 once, access everything forever.</a>' +
      '</div></div>';
    var target = document.querySelector('main') ||
      document.querySelector('.tool-section') ||
      document.querySelector('.container') ||
      document.querySelector('section') ||
      document.body;
    if (target) target.appendChild(el);
  }

  // Track meaningful user actions (button clicks, form submits)
  document.addEventListener('click', function(e) {
    var t = e.target;
    if (t.closest('button, [onclick], .btn, input[type="submit"], input[type="button"]')) {
      v5Count++;
      if (v5Count >= V5_LIMIT) v5ShowNudge();
    }
  }, true);

  // Track file drops/selections (for file-based tools)
  document.addEventListener('change', function(e) {
    if (e.target && e.target.type === 'file') {
      v5Count++;
      if (v5Count >= V5_LIMIT) v5ShowNudge();
    }
  }, true);
})();
