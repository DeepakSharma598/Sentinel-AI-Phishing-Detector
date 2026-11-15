"""
Sentinel-AI - Unified RAG Engine
Coordinates retrieval from the Threat Knowledge Base and generation through
the forensic synthesizer / LLM interface.
"""

from typing import Dict, Any, List, Optional
from .retriever import ThreatKnowledgeRetriever
from .generator import ThreatForensicGenerator

class SentinelRAGEngine:
    def __init__(self, kb_path: Optional[str] = None, api_key: Optional[str] = None):
        self.retriever = ThreatKnowledgeRetriever(kb_path=kb_path) if kb_path else ThreatKnowledgeRetriever()
        self.generator = ThreatForensicGenerator(api_key=api_key)

    def explain_url(self, url: str, scan_result: Dict[str, Any], top_k: int = 3) -> Dict[str, Any]:
        """
        Generates an intelligence-grounded RAG forensic dossier for a scanned URL.
        """
        # Formulate query based on target features
        query_terms = [url]
        target_brand = scan_result.get("target_brand")
        threat_type = scan_result.get("threat_type")
        is_phishing = scan_result.get("is_phishing", False)

        if target_brand:
            query_terms.append(f"{target_brand} brand impersonation")
        if threat_type:
            query_terms.append(threat_type.replace("_", " "))
        if is_phishing:
            query_terms.append("credential harvesting phishing spearphishing link attack T1566")
        else:
            query_terms.append("safe domain legitimate URL analysis")

        search_query = " ".join(query_terms)
        retrieved_docs = self.retriever.search(search_query, top_k=top_k)

        # Synthesize dossier
        dossier = self.generator.synthesize_url_dossier(url, scan_result, retrieved_docs)
        return dossier

    def chat(
        self,
        query: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        context_url: Optional[str] = None,
        top_k: int = 3
    ) -> Dict[str, Any]:
        """
        Interactive Q&A Threat Intelligence Copilot.
        """
        if conversation_history is None:
            conversation_history = []

        retrieved_docs = self.retriever.search(query, top_k=top_k)
        response = self.generator.generate_chat_response(
            query=query,
            conversation_history=conversation_history,
            retrieved_docs=retrieved_docs,
            context_url=context_url
        )
        return response

    def search_threat_intel(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Direct search over the threat knowledge base."""
        return self.retriever.search(query, top_k=top_k)

    def get_knowledge_base_overview(self) -> Dict[str, Any]:
        """Returns overview of available knowledge articles."""
        return self.retriever.get_topics_overview()

# Global engine singleton
_engine_instance: Optional[SentinelRAGEngine] = None

def get_rag_engine() -> SentinelRAGEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = SentinelRAGEngine()
    return _engine_instance
