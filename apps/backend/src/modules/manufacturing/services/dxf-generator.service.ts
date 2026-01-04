import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DxfGeneratorService {
  private readonly logger = new Logger(DxfGeneratorService.name);

  /**
   * Générer un DXF depuis un snapshot
   * TODO: Implémenter la génération réelle avec une librairie DXF
   */
  async generate(snapshot: any): Promise<Buffer> {
    // Pour l'instant, générer un DXF basique
    // TODO: Utiliser une librairie comme dxf-writer ou créer le DXF manuellement

    const specData = snapshot.specData as any;
    const zones = specData?.zones || [];

    // DXF basique (format simplifié)
    let dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
0
ENDSEC
0
SECTION
2
TABLES
0
ENDSEC
0
SECTION
2
BLOCKS
0
ENDSEC
0
SECTION
2
ENTITIES
`;

    // Ajouter les entités texte
    for (const zone of zones) {
      if (zone.input && zone.input.text) {
        const x = 0; // TODO: Utiliser position réelle
        const y = 0;
        const height = zone.input.size || 24;

        dxf += `0
TEXT
8
0
10
${x}
20
${y}
30
0.0
40
${height}
1
${zone.input.text}
0
`;
      }
    }

    dxf += `0
ENDSEC
0
EOF
`;

    return Buffer.from(dxf, 'utf-8');
  }
}







