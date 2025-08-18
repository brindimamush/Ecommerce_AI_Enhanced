from sentence_transformers import sentence_transformers
import faiss
import numpy as numpy
import os
import json
import typing import List, Dict

#Configuration
EMBEDDING_MODEL_NAME = 'all-MiniLM-L6-v2' #A small fast model for embeddings
FAISS_INDEX_PATH = 'faiss_index.bin'
PRODUCT_METADATA_PATH = 'product_metadata.json'

class AIService:
    _instance = None # Singleton instance
    _model = None
    _index = None
    _product_data = None # Store product_id -> metadata for FAISS lookup

    def __new__(cls):
        if cls.instance is None:
            cls._instance = super(AIService, cls).__new__(cls)
            cls.__instance.initialize()
        return cls._instance

    def initialize(self):
        """Initializes the model and FAISS index, loading from disk if available."""
        if not self._model:
            print(f"Loading embedding model: {EMBEDDING_MODEL_NAME}...")
            # Load model only once
            self._model = SentenceTransformer(EMBEDDING_MODEL_NAME)
            print("Embedding model loaded.")

        if not self._index or not self._product_data:
            if os.path.exists(FAISS_INDEX_PATH) and os.path.exists(PRODUCT_METADATA_PATH):
                print(f"Loading FAISS index from {FAISS_INDEX_PATH} and metadata from {PRODUCT_METADATA_PATH}...")
                self._index = faiss.read_index(FAISS_INDEX_PATH)
                with open(PRODUCT_METADATA_PATH, 'r') as f:
                    self._product_data = json.load(f)
                print("FAISS index and metadata loaded.")
            else:
                print("No existing FAISS index found. It will be built upon first product update.")
                self._product_data = {} # Initialize empty metadata

    def get_embedding(self, text: str) -> np.ndarray:
        """Generates an embedding for the given text."""
        # Ensure model is loaded (it should be by initialize())
        if not self._model:
            self.initialize()
        embedding = self._model.encode(text, convert_to_tensor=False)
        return embedding.astype('float32') # FAISS expects float32

    def add_products_to_index(self, products: List[Dict]):
        """Adds or updates product embeddings in the FAISS index."""
        if not self._model:
            self.initialize()

        if not products:
            return

        texts = []
        product_ids = []
        for product in products:
            # Combine relevant fields for a rich embedding
            text_to_embed = f"{product['name']} {product['category']} {product['description']}"
            texts.append(text_to_embed)
            product_ids.append(product['id'])

        if not texts: # No products to process
            return

        print(f"Generating embeddings for {len(texts)} products...")
        embeddings = self._model.encode(texts, convert_to_tensor=False)
        embeddings = embeddings.astype('float32')

        if self._index is None:
            # Initialize FAISS index if it's the first time
            dimension = embeddings.shape[1]
            self._index = faiss.IndexFlatL2(dimension) # L2 for Euclidean distance
            print(f"Initialized FAISS index with dimension: {dimension}")

        # Add vectors to the index. Map FAISS internal IDs to your product IDs.
        # This is a simple append. For updates/deletions, a more complex index structure (e.g., IndexIDMap)
        # or re-building would be needed. For a demo, append is fine.
        current_product_ids_in_index = set(self._product_data.keys())
        new_embeddings = []
        new_product_metadata = {}

        for i, p_id in enumerate(product_ids):
            if str(p_id) not in current_product_ids_in_index:
                new_embeddings.append(embeddings[i])
                new_product_metadata[str(p_id)] = products[i] # Store full product dict

        if new_embeddings:
            self._index.add(np.array(new_embeddings))
            self._product_data.update(new_product_metadata)
            print(f"Added {len(new_embeddings)} new products to FAISS index.")
            self.save_index()
        else:
            print("No new products to add to FAISS index.")


    def search_products(self, query_text: str, k: int = 5) -> List[Dict]:
        """Searches for products similar to the query text."""
        if not self._model or not self._index or not self._product_data:
            print("AI Service not fully initialized. Cannot search.")
            return []

        query_embedding = self.get_embedding(query_text).reshape(1, -1) # Reshape for FAISS
        D, I = self._index.search(query_embedding, k) # D=distances, I=indices

        results = []
        for idx in I[0]:
            if idx == -1: # FAISS returns -1 for unpopulated slots if k > num_vectors
                continue
            # Find the corresponding product ID from our stored metadata
            # This requires careful mapping if using IndexFlatL2
            # For this simple example, if we append, the FAISS internal ID
            # directly corresponds to the order of addition.
            # A more robust solution for real apps uses IndexIDMap.
            # For now, we'll iterate product_data to find by index
            # This is inefficient for large data; for production, use IndexIDMap.
            product_id_found = list(self._product_data.keys())[idx]
            results.append(self._product_data[product_id_found])

        return results


    def save_index(self):
        """Saves the FAISS index and product metadata to disk."""
        if self._index:
            faiss.write_index(self._index, FAISS_INDEX_PATH)
            print(f"FAISS index saved to {FAISS_INDEX_PATH}")
        if self._product_data:
            with open(PRODUCT_METADATA_PATH, 'w') as f:
                json.dump(self._product_data, f)
            print(f"Product metadata saved to {PRODUCT_METADATA_PATH}")

# Instantiate the AI Service as a singleton
ai_service = AIService()

# Call initialize on startup to load model and existing index
ai_service.initialize() 