import spacy
import json
import os

# Load Spanish NLP model
es_nlp = spacy.load("es_core_news_sm")

# Dictionary will be loaded here
SPANISH_DICT = {}
DICT_LOADED = False

def load_dictionary():
    """Load the comprehensive Spanish-English dictionary from JSON file"""
    global SPANISH_DICT, DICT_LOADED
    
    if DICT_LOADED:
        return
        
    try:
        dict_path = os.path.join(os.path.dirname(__file__), "en_es_aidict.json")
        with open(dict_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # The file might be a JSON string that needs to be parsed
        if content.startswith('"[') and content.endswith(']"'):
            # It's a JSON-encoded string, need to decode twice
            content = json.loads(content)
            
        if isinstance(content, str):
            dict_data = json.loads(content)
        else:
            dict_data = content
            
        # Create lookup dictionary for fast access
        for entry in dict_data:
            if isinstance(entry, dict) and 'word' in entry and entry['word']:
                word = str(entry['word']).lower()
                if word:  # Make sure word is not empty
                    SPANISH_DICT[word] = entry
                
        DICT_LOADED = True
        print(f"Successfully loaded {len(SPANISH_DICT)} dictionary entries")
        
    except Exception as e:
        print(f"Warning: Could not load dictionary ({e}). Using basic fallback.")
        DICT_LOADED = True  # Don't keep trying
        SPANISH_DICT = {}

def get_translation_info(word, lemma=None):
    """Get translation info for a word"""
    if not DICT_LOADED:
        load_dictionary()
    
    if not word:
        return None
        
    word_lower = str(word).lower()
    
    # Try exact word match
    if word_lower in SPANISH_DICT:
        return SPANISH_DICT[word_lower]
    
    # Try lemma
    if lemma:
        lemma_lower = str(lemma).lower()
        if lemma_lower in SPANISH_DICT:
            return SPANISH_DICT[lemma_lower]
    
    return None

def dictionary(sentence):
    """Parse sentence and return token information"""
    if not DICT_LOADED:
        load_dictionary()
        
    doc = es_nlp(sentence)
    sentence_parsed = []
    
    for token in doc:
        # Skip punctuation and whitespace
        if not token.is_alpha and not token.is_digit:
            continue
            
        parts = []
        
        # Word and lemma
        word_info = f"**{token.text}**"
        if token.is_alpha and token.lemma_ != token.text.lower(): 
            word_info += f" (lemma: {token.lemma_})"
        parts.append(word_info)
        
        # Try to get info from dictionary
        dict_entry = get_translation_info(token.text, token.lemma_)
        
        if dict_entry:
            # Use rich dictionary data
            translation = dict_entry.get('translation', '')
            if translation:
                parts.append(f"Translation: {translation}")
            
            example_1 = dict_entry.get('example_1', '')
            example_trans_1 = dict_entry.get('example_translation_1', '')
            
            if example_1 and example_trans_1:
                parts.append(f"Example: {example_1}")
                parts.append(f"→ {example_trans_1}")
        
        else:
            # Fallback to basic spaCy analysis
            if token.pos_:
                pos_names = {
                    'NOUN': 'Noun', 'VERB': 'Verb', 'ADJ': 'Adjective', 
                    'ADV': 'Adverb', 'PRON': 'Pronoun', 'DET': 'Determiner',
                    'ADP': 'Preposition', 'AUX': 'Auxiliary Verb'
                }
                pos_name = pos_names.get(token.pos_, token.pos_)
                parts.append(f"Part of Speech: {pos_name}")
        
        blurb = "\n".join(parts)
        sentence_parsed.append((token.idx, blurb))
    
    return sentence_parsed

if __name__ == "__main__":
    # Test with a simple sentence
    test_sentence = "¿Dónde está la biblioteca?"
    print(f"Testing: {test_sentence}")
    
    try:
        results = dictionary(test_sentence)
        print(f"Success! Found {len(results)} tokens")
        for idx, blurb in results:
            print(f"\nToken at {idx}:")
            print(blurb)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()