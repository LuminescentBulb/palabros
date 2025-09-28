import spacy

try:
    import translate
    es_to_en = translate.Translator(from_lang="es",to_lang="en")
    TRANSLATE_AVAILABLE = True
except ImportError:
    TRANSLATE_AVAILABLE = False
    print("Warning: translate package not available. Translations will be skipped.")

es_nlp = spacy.load("es_core_news_sm")

def dictionary(sentence):
    doc = es_nlp(sentence)
    sentence_parsed = []
    for token in doc:
        # Skip punctuation and whitespace tokens
        if not token.is_alpha and not token.is_digit:
            continue
            
        # Build the blurb
        parts = []
        
        # Word and lemma
        word_info = f"**{token.text}**"
        if token.is_alpha and token.lemma_ != token.text.lower(): 
            word_info += f" (from lemma: {token.lemma_})"
        parts.append(word_info)
        
        # Part of speech
        if token.pos_:
            pos_full = {
                'NOUN': 'Noun', 'VERB': 'Verb', 'ADJ': 'Adjective', 
                'ADV': 'Adverb', 'PRON': 'Pronoun', 'DET': 'Determiner',
                'ADP': 'Preposition', 'CONJ': 'Conjunction', 'NUM': 'Number',
                'PART': 'Particle', 'INTJ': 'Interjection', 'PROPN': 'Proper Noun'
            }.get(token.pos_, token.pos_)
            parts.append(f"Part of Speech: {pos_full}")
        
        # Morphological features
        if token.is_alpha and token.morph:
            morph_str = str(token.morph)
            if morph_str and morph_str != "{}":
                parts.append(f"Grammar: {morph_str}")
        
        # Translation
        if token.is_alpha and TRANSLATE_AVAILABLE:
            try:
                translation = es_to_en.translate(token.text)
                if translation and translation != token.text:
                    parts.append(f"Translation: {translation}")
            except Exception as e:
                print(f"Translation error for '{token.text}': {e}")
        
        # Join all parts
        blurb = "\n".join(parts)
        sentence_parsed.append((token.idx, blurb))
    
    return sentence_parsed

if __name__ == "__main__":
    for s in dictionary("¿Dónde está la biblioteca?"):
        print(f"Index: {s[0]}")
        print(s[1])
        print("-" * 40)