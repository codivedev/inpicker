import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wand2, Upload, Loader2, Save, Bookmark } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { DrawingPicker } from '@/features/drawings/components/DrawingPicker';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);

interface AIPaletteColor {
    hex: string;
    description: string;
    pencil: {
        brand: string;
        name: string;
        id: string;
    };
}

export function PaletteGenerator() {
    const navigate = useNavigate();
    const { addCustomPencil } = useInventory();

    const [image, setImage] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [palette, setPalette] = useState<AIPaletteColor[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedPencilForDrawing, setSelectedPencilForDrawing] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setImage(base64);
            analyzeImage(base64, file.type);
        };
        reader.readAsDataURL(file);
    };

    const analyzeImage = async (base64Data: string, mimeType: string) => {
        setAnalyzing(true);
        setError(null);
        setPalette([]);

        try {
            const base64Content = base64Data.split(',')[1];
            const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

            const prompt = `
            Analyse cette image et identifie les 10 couleurs les plus dominantes/importantes pour reproduire ce dessin.
            Pour chaque couleur, trouve l'équivalent le plus PROCHE parmi les crayons des marques "Prismacolor Premier" ou "Faber-Castell Polychromos".
            
            IMPORTANT: Réponds exclusivement en FRANÇAIS pour les descriptions et les noms de couleurs.
            
            Retourne UNIQUEMENT un tableau JSON avec cette structure :
            [
              {
                "hex": "#RRGGBB",
                "description": "Nom court de la couleur ou description en français",
                "pencil": {
                   "brand": "Prismacolor" ou "Faber-Castell",
                   "name": "Nom du crayon (en français si possible)",
                   "id": "ID ou numéro du crayon"
                }
              }
            ]
            `;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Content,
                        mimeType: mimeType
                    }
                }
            ]);

            const response = await result.response;
            const text = response.text();
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr) as AIPaletteColor[];

            setPalette(data);

        } catch (err: any) {
            console.error("AI Error:", err);
            setError(err.message || "Impossible d'analyser l'image. Vérifiez votre clé API ou connexion.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSavePencil = (color: AIPaletteColor) => {
        addCustomPencil(color.pencil.brand, color.pencil.name, color.pencil.id, color.hex);
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-6 pb-24">
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={() => navigate('/tableau-de-bord')}
                    className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Wand2 className="text-pink-500" />
                        Générateur IA
                    </h1>
                    <p className="text-xs text-muted-foreground">Powered by Gemini 3 Pro Image (Preview)</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                    <label className={`
                        aspect-video md:aspect-square rounded-3xl border-2 border-dashed 
                        flex flex-col items-center justify-center text-center p-6 
                        transition-all cursor-pointer relative overflow-hidden group
                        ${image ? 'border-primary/50' : 'border-muted-foreground/20 hover:bg-secondary/30'}
                     `}>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

                        {image ? (
                            <img src={image} alt="Preview" className="absolute inset-0 w-full h-full object-contain bg-black/50" />
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
                                <div className="p-4 bg-secondary rounded-full">
                                    <Upload size={32} />
                                </div>
                                <span className="font-medium">Touchez pour importer une image</span>
                            </div>
                        )}

                        {analyzing && (
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                <Loader2 className="animate-spin text-primary mb-2" size={48} />
                                <span className="font-bold animate-pulse">Analyse en cours...</span>
                                <span className="text-xs text-muted-foreground mt-1">Extraction des couleurs dominantes</span>
                            </div>
                        )}
                    </label>
                </div>

                <div className="flex flex-col gap-3">
                    {palette.length > 0 && (
                        <h3 className="font-bold text-lg mb-2">Palette Suggérée ({palette.length})</h3>
                    )}

                    {palette.map((item, idx) => {
                        const pencilId = `${item.pencil.brand}-${item.pencil.id}`;
                        return (
                            <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-card border shadow-sm animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 0.1}s` }}>
                                <div
                                    className="w-12 h-12 rounded-full border shadow-inner shrink-0"
                                    style={{ backgroundColor: item.hex }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-bold truncate">{item.pencil.name}</span>
                                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
                                            {item.pencil.id}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                                        <span>{item.pencil.brand}</span>
                                        <span style={{ color: item.hex }}>● {item.description}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedPencilForDrawing(pencilId)}
                                    className="p-2 rounded-full hover:bg-amber-500/10 transition-colors text-amber-500"
                                    title="Ajouter à un dessin"
                                >
                                    <Bookmark size={18} />
                                </button>
                                <button
                                    onClick={() => handleSavePencil(item)}
                                    className="p-2 rounded-full hover:bg-secondary transition-colors text-primary"
                                    title="Ajouter à l'inventaire"
                                >
                                    <Save size={20} />
                                </button>
                            </div>
                        );
                    })}

                    {!analyzing && !image && (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-8 opacity-50 border-2 border-dashed border-border rounded-3xl">
                            <Wand2 size={48} className="mb-4 opacity-50" />
                            <p>Les résultats de l'analyse IA apparaîtront ici.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Drawing Picker Modal */}
            <DrawingPicker
                isOpen={!!selectedPencilForDrawing}
                onClose={() => setSelectedPencilForDrawing(null)}
                onSelect={() => setSelectedPencilForDrawing(null)}
                pencilId={selectedPencilForDrawing || ''}
            />
        </div>
    );
}
