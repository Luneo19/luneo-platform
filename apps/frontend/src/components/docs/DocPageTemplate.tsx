'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface DocPageTemplateProps {
  title: string;
  description: string;
  breadcrumbs: { label: string; href: string }[];
  children: React.ReactNode;
  relatedLinks?: { title: string; href: string; description: string }[];
}

export function DocPageTemplate({ 
  title, 
  description, 
  breadcrumbs, 
  children,
  relatedLinks = []
}: DocPageTemplateProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-gray-400 mb-6">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="mx-2">›</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-white">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-white transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Header */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
          <p className="text-xl text-gray-300 mb-12">{description}</p>

          {/* Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            {children}
          </div>

          {/* Related Links */}
          {relatedLinks.length > 0 && (
            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-6">Articles liés</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {relatedLinks.map((link, index) => (
                  <Link key={index} href={link.href}>
                    <Card className="bg-gray-800 border-gray-700 p-6 hover:border-blue-500/50 transition-all h-full">
                      <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                        {link.title}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </h4>
                      <p className="text-gray-300 text-sm">{link.description}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back to docs */}
          <div className="mt-12 pt-6 border-t border-gray-700">
            <Link href="/help/documentation">
              <Button variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la documentation
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
