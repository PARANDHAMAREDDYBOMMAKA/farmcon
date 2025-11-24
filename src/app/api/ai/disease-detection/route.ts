import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/ai/disease-detection:
 *   post:
 *     summary: Detect crop diseases using AI
 *     description: |
 *       Analyzes crop symptoms described by the farmer and uses AI to identify potential diseases,
 *       providing treatment recommendations, prevention strategies, and severity assessment.
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cropName
 *               - symptoms
 *             properties:
 *               cropName:
 *                 type: string
 *                 description: Name of the crop affected
 *                 example: Tomato
 *               symptoms:
 *                 type: array
 *                 description: List of observed symptoms
 *                 items:
 *                   type: string
 *                 example: ["yellow leaves", "brown spots", "wilting"]
 *               imageDescription:
 *                 type: string
 *                 description: Detailed description of what you see on the plant
 *                 example: "Leaves have brown circular spots with yellow halos"
 *               location:
 *                 type: string
 *                 description: Geographic location for region-specific diseases
 *                 example: "Maharashtra"
 *     responses:
 *       200:
 *         description: Disease detection completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 diseases:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DiseaseDetection'
 *                 cropName:
 *                   type: string
 *                 analysisDate:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const { cropName, symptoms, imageDescription, location } = await request.json();

    if (!cropName || !symptoms || symptoms.length === 0) {
      return NextResponse.json(
        { error: 'Crop name and at least one symptom are required' },
        { status: 400 }
      );
    }

    // Use AI to analyze symptoms and detect diseases
    const diseases = await detectDiseases(cropName, symptoms, imageDescription, location);

    return NextResponse.json({
      cropName,
      location: location || 'Not specified',
      symptomsAnalyzed: symptoms,
      diseases,
      analysisDate: new Date().toISOString(),
      disclaimer: 'This is an AI-powered analysis. For critical cases, please consult an agricultural expert or local extension officer.',
    });
  } catch (error) {
    console.error('Disease detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect disease' },
      { status: 500 }
    );
  }
}

async function detectDiseases(
  cropName: string,
  symptoms: string[],
  imageDescription?: string,
  location?: string
) {
  try {
    if (!process.env.GROQ_API_KEY) {
      // Fallback to knowledge base if no AI available
      return getFallbackDiseaseInfo(cropName, symptoms);
    }

    const symptomsText = symptoms.join(', ');
    const prompt = `You are an expert plant pathologist specializing in Indian agriculture. A farmer has reported the following issue:

Crop: ${cropName}
Location: ${location || 'India'}
Symptoms observed: ${symptomsText}
${imageDescription ? `\nVisual description: ${imageDescription}` : ''}

Please analyze these symptoms and provide:
1. The most likely disease(s) affecting this crop (up to 3 possibilities, ranked by likelihood)
2. For each disease provide:
   - Disease name (both common and scientific name)
   - Confidence level (0-1)
   - Specific symptoms that match
   - Recommended organic and chemical treatments
   - Prevention strategies
   - Severity level (low/medium/high/critical)
   - Expected recovery time
   - Whether it's contagious to other plants

Format your response as a JSON array of diseases, ordered by likelihood:
[
  {
    "disease": "Common name (Scientific name)",
    "confidence": 0.85,
    "matchedSymptoms": ["symptom1", "symptom2"],
    "organicTreatment": "Detailed organic treatment steps",
    "chemicalTreatment": "Recommended pesticides/fungicides with dosage",
    "prevention": "How to prevent this disease in future",
    "severity": "medium",
    "recoveryTime": "7-14 days with treatment",
    "contagious": true,
    "additionalNotes": "Any other important information"
  }
]

Consider common diseases for ${cropName} in ${location || 'India'}, local climate conditions, and seasonal factors.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert plant pathologist with extensive knowledge of crop diseases in India. Always respond in valid JSON format with accurate, actionable advice for farmers.',
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error, falling back to knowledge base');
      return getFallbackDiseaseInfo(cropName, symptoms);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '';

    // Parse AI response
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((disease: any) => ({
          disease: disease.disease,
          confidence: disease.confidence,
          symptoms: disease.matchedSymptoms,
          treatment: {
            organic: disease.organicTreatment,
            chemical: disease.chemicalTreatment,
          },
          prevention: disease.prevention,
          severity: disease.severity,
          recoveryTime: disease.recoveryTime,
          contagious: disease.contagious,
          additionalNotes: disease.additionalNotes,
        }));
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }

    // Fallback to knowledge base
    return getFallbackDiseaseInfo(cropName, symptoms);
  } catch (error) {
    console.error('AI disease detection error:', error);
    return getFallbackDiseaseInfo(cropName, symptoms);
  }
}

function getFallbackDiseaseInfo(cropName: string, symptoms: string[]) {
  // Knowledge base of common diseases by crop
  const diseaseKnowledgeBase: any = {
    rice: [
      {
        disease: 'Blast (Magnaporthe oryzae)',
        keywords: ['spots', 'lesions', 'gray', 'brown'],
        confidence: 0.7,
        symptoms: ['Diamond-shaped spots on leaves', 'Gray center with brown margins', 'Neck rot in severe cases'],
        treatment: {
          organic: 'Remove infected plants, improve air circulation, use neem oil spray (5ml/liter). Apply Pseudomonas fluorescens bio-fungicide.',
          chemical: 'Apply Tricyclazole (0.6g/L) or Carbendazim (1g/L) at first sign of infection. Repeat after 10 days if needed.',
        },
        prevention: 'Use resistant varieties, maintain proper spacing, avoid excessive nitrogen fertilizer, ensure good drainage.',
        severity: 'high',
        recoveryTime: '14-21 days with treatment',
        contagious: true,
        additionalNotes: 'Most destructive rice disease. Monitor regularly during humid weather.',
      },
      {
        disease: 'Bacterial Leaf Blight (Xanthomonas oryzae)',
        keywords: ['yellow', 'wilting', 'water', 'leaf'],
        confidence: 0.65,
        symptoms: ['Yellow to white lesions on leaves', 'Leaves turn grayish-white and dry', 'Wilting of seedlings'],
        treatment: {
          organic: 'Remove infected leaves, use copper-based bactericides. Apply Pseudomonas-based biocontrol agents.',
          chemical: 'Spray Streptocycline (200 ppm) + Copper oxychloride (2.5g/L). Repeat twice at 10-day intervals.',
        },
        prevention: 'Use certified disease-free seeds, avoid deep standing water, remove weed hosts, balance fertilizer application.',
        severity: 'medium',
        recoveryTime: '10-15 days',
        contagious: true,
        additionalNotes: 'Spread through water and wind. More severe in waterlogged conditions.',
      },
    ],
    tomato: [
      {
        disease: 'Late Blight (Phytophthora infestans)',
        keywords: ['brown', 'spots', 'rot', 'water', 'dark'],
        confidence: 0.75,
        symptoms: ['Dark brown to black spots on leaves', 'White fungal growth on undersides', 'Fruit rot with dark patches'],
        treatment: {
          organic: 'Remove infected plants immediately. Spray copper-based fungicides (3g/L). Use Bordeaux mixture (1%) every 7 days.',
          chemical: 'Apply Mancozeb (2.5g/L) + Metalaxyl (1g/L). Alternate with Cymoxanil + Famoxadone. Spray weekly during humid weather.',
        },
        prevention: 'Use resistant varieties, ensure proper spacing, avoid overhead irrigation, remove infected debris, crop rotation with non-solanaceous crops.',
        severity: 'critical',
        recoveryTime: '21-30 days; remove heavily infected plants',
        contagious: true,
        additionalNotes: 'Extremely destructive in cool, humid conditions. Can destroy entire crop in 7-10 days if untreated.',
      },
      {
        disease: 'Leaf Curl Virus (Tomato Leaf Curl Virus)',
        keywords: ['curl', 'yellow', 'twisted', 'deformed'],
        confidence: 0.8,
        symptoms: ['Upward curling of leaves', 'Yellowing between veins', 'Stunted growth', 'Reduced fruit size'],
        treatment: {
          organic: 'Remove infected plants, control whitefly vectors with neem oil (5ml/L), yellow sticky traps, spray neem extract twice weekly.',
          chemical: 'No direct cure for virus. Control whiteflies with Imidacloprid (0.3ml/L) or Acetamiprid (0.4g/L). Use systemic insecticides.',
        },
        prevention: 'Use virus-free certified seeds/seedlings, install insect-proof nets, mulch with silver reflective material, destroy infected plants, control whitefly population.',
        severity: 'high',
        recoveryTime: 'No recovery; prevent spread to healthy plants',
        contagious: true,
        additionalNotes: 'Transmitted by whiteflies. Extremely common in summer. Focus on vector control and prevention.',
      },
      {
        disease: 'Early Blight (Alternaria solani)',
        keywords: ['target', 'concentric', 'rings', 'brown', 'yellow'],
        confidence: 0.7,
        symptoms: ['Concentric ring patterns (target spots) on older leaves', 'Yellowing around spots', 'Defoliation in severe cases'],
        treatment: {
          organic: 'Remove affected leaves, improve air circulation, spray baking soda solution (5g/L + liquid soap), use compost tea.',
          chemical: 'Apply Mancozeb (2.5g/L) or Chlorothalonil (2g/L) every 7-10 days. Rotate with Azoxystrobin for better efficacy.',
        },
        prevention: 'Practice crop rotation, use drip irrigation, mulch to prevent soil splash, ensure adequate plant nutrition, remove plant debris.',
        severity: 'medium',
        recoveryTime: '14-21 days with treatment',
        contagious: true,
        additionalNotes: 'Fungus survives in soil and debris. More common in warm, humid weather.',
      },
    ],
    wheat: [
      {
        disease: 'Rust (Puccinia spp.)',
        keywords: ['rust', 'orange', 'red', 'pustules', 'yellow'],
        confidence: 0.8,
        symptoms: ['Orange to red-brown pustules on leaves', 'Yellow spots on upper leaf surface', 'Premature drying'],
        treatment: {
          organic: 'Remove infected plants, use sulfur-based fungicides, spray garlic extract solution.',
          chemical: 'Apply Propiconazole (0.1%) or Tebuconazole (0.1%). Repeat after 15 days if infection persists.',
        },
        prevention: 'Use resistant varieties, timely sowing, balanced fertilization, remove volunteer wheat plants.',
        severity: 'high',
        recoveryTime: '15-20 days',
        contagious: true,
        additionalNotes: 'Three types: leaf rust, stem rust, stripe rust. Very destructive if left untreated.',
      },
    ],
  };

  // Get diseases for the specific crop
  const cropKey = cropName.toLowerCase().trim();
  let cropDiseases = diseaseKnowledgeBase[cropKey] || [];

  // If no specific crop match, provide generic advice
  if (cropDiseases.length === 0) {
    return [
      {
        disease: 'Unknown Disease - Requires Expert Diagnosis',
        confidence: 0.5,
        symptoms: symptoms,
        treatment: {
          organic: 'Remove affected plant parts, improve air circulation, ensure proper watering, spray neem oil (5ml/liter) as general preventive measure.',
          chemical: 'Consult local agricultural extension officer for specific treatment. General broad-spectrum fungicide like Copper oxychloride (3g/L) may help.',
        },
        prevention: 'Maintain plant health through proper nutrition, avoid overcrowding, ensure good drainage, practice crop rotation, remove plant debris regularly.',
        severity: 'medium',
        recoveryTime: 'Variable - depends on specific disease',
        contagious: true,
        additionalNotes: `We don't have specific disease information for ${cropName} in our database. Please consult a local agricultural expert or extension officer for accurate diagnosis and treatment. Take clear photos of affected plants for better diagnosis.`,
      },
    ];
  }

  // Match symptoms with diseases
  const symptomsLower = symptoms.map(s => s.toLowerCase());
  const scoredDiseases = cropDiseases.map((disease: any) => {
    const matchCount = disease.keywords.filter((keyword: string) =>
      symptomsLower.some(symptom => symptom.includes(keyword))
    ).length;

    return {
      ...disease,
      matchScore: matchCount,
    };
  });

  // Sort by match score and return top 3
  return scoredDiseases
    .sort((a: any, b: any) => b.matchScore - a.matchScore)
    .slice(0, 3)
    .map((disease: any) => {
      const { keywords, matchScore, ...rest } = disease;
      return rest;
    });
}
