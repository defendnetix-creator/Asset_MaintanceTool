// frontend/src/pages/ScanPage.tsx
// Mobile PWA scanner page

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ScanBarcode, Camera, Flashlight, X, Check, Loader2, 
  History, Settings, Home, Package, AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { cn, formatDateTime } from '../utils/helpers';
import { useToast } from '../components/ui/useToast';
import { useAuth } from '../hooks/useAuth';

export function ScanPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [hasPermission, setHasPermission] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<Array<{ tag: string; timestamp: Date; success: boolean }>>([]);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Request camera permission on mount
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setHasPermission(true);
      } catch (err) {
        console.error('Camera access denied:', err);
        toast.error('Camera access is required for scanning');
        setHasPermission(false);
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  // Toggle torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track.getCapabilities().torch) {
      try {
        await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
        setTorchOn(!torchOn);
      } catch (err) {
        console.error('Torch toggle failed:', err);
      }
    }
  };

  // Switch camera
  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Simulated barcode scanning (in production, use QuaggaJS or @zxing/library)
  const handleScan = async () => {
    if (!videoRef.current || scanning) return;
    setScanning(true);
    
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In production, this would use actual barcode detection
    // For demo, generate a sample asset tag
    const sampleTags = ['LPT-0042', 'MON-0012', 'DSK-0100', 'PRN-0005', 'CHR-0033'];
    const result = sampleTags[Math.floor(Math.random() * sampleTags.length)];
    
    setScanResult(result);
    setScanHistory(prev => [{ tag: result, timestamp: new Date(), success: true }, ...prev.slice(0, 9)]);
    toast.success(`Scanned: ${result}`);
    setScanning(false);
  };

  const clearResult = () => {
    setScanResult(null);
  };

  const viewAsset = () => {
    if (scanResult) {
      navigate(`/assets/${scanResult}`); // Would need to map tag to ID
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex h-full items-center justify-between px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <Home className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Scanner</h1>
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="p-4 pb-24">
        {/* Camera View */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Point camera at barcode/QR code</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={switchCamera} disabled={scanning}>
                  <Camera className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={toggleTorch} disabled={scanning || !hasPermission}>
                  {torchOn ? <Flashlight className="h-4 w-4 text-amber-500" /> : <Flashlight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 relative">
            {hasPermission ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full aspect-video object-cover"
                  playsInline
                  muted
                />
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={cn(
                    'w-64 h-32 border-2 border-primary/50 rounded-lg shadow-lg',
                    scanning && 'animate-pulse border-primary'
                  )}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs text-primary font-medium">
                      SCAN AREA
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                      Align barcode within frame
                    </div>
                  </div>
                </div>
                
                {/* Scan result overlay */}
                {scanResult && (
                  <div className="absolute bottom-4 left-4 right-4 z-10 animate-slide-up">
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Check className="h-6 w-6 text-green-600" />
                            <div>
                              <p className="font-medium">Asset Found</p>
                              <p className="text-sm text-muted-foreground font-mono">{scanResult}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={clearResult}>
                              <X className="h-4 w-4" />
                              Scan Again
                            </Button>
                            <Button size="sm" onClick={viewAsset}>
                              View Asset
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Scan button */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <Button 
                    size="lg" 
                    onClick={handleScan} 
                    disabled={scanning}
                    className="w-48"
                  >
                    {scanning ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <ScanBarcode className="h-5 w-5 mr-2" />
                        Scan
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                <Camera className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Camera access required</p>
                <p className="text-sm">Please enable camera permissions to scan</p>
                <Button className="mt-4" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scan History */}
        <Card className="mt-4">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent Scans</CardTitle>
            {scanHistory.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setScanHistory([])}>
                <History className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {scanHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No scans yet</p>
                <p className="text-sm">Scan your first asset to see history</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {scanHistory.map((scan, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-mono font-medium">{scan.tag}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(scan.timestamp)}</p>
                      </div>
                    </div>
                    <Badge variant={scan.success ? 'success' : 'destructive'}>
                      {scan.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => navigate('/assets/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
          <Button variant="outline" onClick={() => navigate('/audits')}>
            <Package className="h-4 w-4 mr-2" />
            Start Audit
          </Button>
        </div>
      </main>

      {/* Bottom Navigation (Mobile PWA) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-2 py-2 safe-area-bottom md:hidden">
        <div className="flex justify-around">
          <Button variant="ghost" className="flex flex-col items-center gap-1 px-3 py-2" onClick={() => navigate('/')}>
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center gap-1 px-3 py-2 bg-primary/10 text-primary" onClick={() => navigate('/scan')}>
            <ScanBarcode className="h-5 w-5" />
            <span className="text-xs">Scan</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center gap-1 px-3 py-2" onClick={() => navigate('/audits')}>
            <Package className="h-5 w-5" />
            <span className="text-xs">Audits</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center gap-1 px-3 py-2" onClick={() => navigate('/settings')}>
            <Settings className="h-5 w-5" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}