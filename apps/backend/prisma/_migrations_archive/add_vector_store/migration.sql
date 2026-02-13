-- Migration: Add vector store support for RAG
-- This migration adds pgvector extension and embedding column

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to KnowledgeBaseArticle
ALTER TABLE "KnowledgeBaseArticle" 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS knowledge_base_article_embedding_idx 
ON "KnowledgeBaseArticle" 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add comment
COMMENT ON COLUMN "KnowledgeBaseArticle".embedding IS 'Vector embedding for semantic search (OpenAI text-embedding-ada-002, 1536 dimensions)';
