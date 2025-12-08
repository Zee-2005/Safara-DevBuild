// // import { useEffect, useRef, useState } from 'react';
// // import { Card } from '@/components/ui/card';
// // import { Button } from '@/components/ui/button';
// // import { Badge } from '@/components/ui/badge';
// // import { 
// //   QrCode, 
// //   Download, 
// //   Share2, 
// //   Shield,
// //   Clock,
// //   CheckCircle,
// //   AlertTriangle
// // } from 'lucide-react';
// // import { useUserData } from "@/context/UserDataContext";


  

  
    


// // interface TouristIdData {
// //   id: string;
// //   destination: string;
// //   validUntil: Date | string;
// //   status: 'active' | 'expiring' | 'expired';
// //   holderName: string;
// //   issueDate: Date | string;
// // }

// // interface QRCodeDisplayProps {
// //   touristId: TouristIdData;
// // }

// // export default function QRCodeDisplay({ touristId }: QRCodeDisplayProps) {
// //   const canvasRef = useRef<HTMLCanvasElement>(null);
// //   const [qrGenerated, setQrGenerated] = useState(false);
// //   const [timeRemaining, setTimeRemaining] = useState('');
// //   const { personal, tourist, updatePersonal, updateTourist, clearAll } = useUserData();

// //   // Normalize dates (safe guard for string inputs)
// //   const issueDate = new Date(touristId.issueDate);
// //   const validUntil = new Date(touristId.validUntil);

// //   // Generate QR Code
// //   useEffect(() => {
// //     const generateQRCode = async () => {
// //       try {
// //         const QRCode = await import('qrcode');
        
// //         const credentialData = {
// //           '@context': 'https://www.w3.org/2018/credentials/v1',
// //           type: ['VerifiableCredential', 'SaFaraTouristID'],
// //           issuer: 'did:web:SaFara.gov.in',
// //           issuanceDate: issueDate.toISOString(),
// //           expirationDate: validUntil.toISOString(),
// //           credentialSubject: {
// //             id: `did:SaFara:${touristId.id}`,
// //             type: 'Tourist',
// //             name: touristId.holderName,
// //             destination: touristId.destination,
// //             validUntil: validUntil.toISOString(),
// //             status: touristId.status
// //           },
// //           proof: {
// //             type: 'SaFaraProof2024',
// //             created: new Date().toISOString(),
// //             verificationMethod: 'SaFara-key-1',
// //             proofPurpose: 'assertionMethod',
// //             jws: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9...' // Mock signature
// //           }
// //         };

// //         const qrString = JSON.stringify(credentialData);
        
// //         if (canvasRef.current) {
// //           await QRCode.toCanvas(canvasRef.current, qrString, {
// //             width: 200,
// //             margin: 2,
// //             color: {
// //               dark: '#000000',
// //               light: '#FFFFFF'
// //             }
// //           });
// //           setQrGenerated(true);
// //         }
// //       } catch (error) {
// //         console.error('Error generating QR code:', error);
// //       }
// //     };

// //     generateQRCode();
// //   }, [touristId, issueDate, validUntil]);

// //   // Update time remaining
// //   useEffect(() => {
// //     const updateTimeRemaining = () => {
// //       const now = new Date();
// //       const diff = validUntil.getTime() - now.getTime();
      
// //       if (diff <= 0) {
// //         setTimeRemaining('Expired');
// //         return;
// //       }
      
// //       const days = Math.floor(diff / (1000 * 60 * 60 * 24));
// //       const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
// //       if (days > 0) {
// //         setTimeRemaining(`${days}d ${hours}h remaining`);
// //       } else {
// //         setTimeRemaining(`${hours}h remaining`);
// //       }
// //     };

// //     updateTimeRemaining();
// //     const interval = setInterval(updateTimeRemaining, 60000);
    
// //     return () => clearInterval(interval);
// //   }, [validUntil]);

// //   const handleDownload = async () => {
// //     if (canvasRef.current) {
// //       try {
// //         const canvas = canvasRef.current;
// //         const link = document.createElement('a');
// //         link.download = `SaFara-TouristID-${touristId.id}.png`;
// //         link.href = canvas.toDataURL();
// //         link.click();
// //         console.log('QR Code downloaded');
// //       } catch (error) {
// //         console.error('Error downloading QR code:', error);
// //       }
// //     }
// //   };

// //   const handleShare = async () => {
// //     if (canvasRef.current && navigator.share) {
// //       try {
// //         const canvas = canvasRef.current;
// //         const blob = await new Promise<Blob>((resolve) => {
// //           canvas.toBlob((blob) => resolve(blob!), 'image/png');
// //         });
        
// //         const file = new File([blob], `SaFara-ID-${touristId.id}.png`, { 
// //           type: 'image/png' 
// //         });
        
// //         await navigator.share({
// //           title: 'SaFara Tourist ID',
// //           text: `My verified tourist credentials for ${touristId.destination}`,
// //           files: [file]
// //         });
// //         console.log('QR Code shared');
// //       } catch (error) {
// //         console.error('Error sharing QR code:', error);
// //       }
// //     }
// //   };

// //   const getStatusColor = (status: string) => {
// //     switch (status) {
// //       case 'active': return 'bg-safety-green text-white';
// //       case 'expiring': return 'bg-safety-yellow text-black';
// //       case 'expired': return 'bg-safety-red text-white';
// //       default: return 'bg-gray-500 text-white';
// //     }
// //   };

// //   const getStatusIcon = (status: string) => {
// //     switch (status) {
// //       case 'active': return <CheckCircle className="w-4 h-4" />;
// //       case 'expiring': return <AlertTriangle className="w-4 h-4" />;
// //       case 'expired': return <AlertTriangle className="w-4 h-4" />;
// //       default: return <Shield className="w-4 h-4" />;
// //     }
// //   };

// //   return (
// //     <div className="max-w-sm mx-auto p-4 space-y-4">
// //       {/* ID Header */}
// //       <Card className="p-4">
// //         <div className="text-center space-y-2">
// //           <div className="flex items-center justify-center gap-2">
// //             <Shield className="w-6 h-6 text-primary" />
// //             <h2 className="text-lg font-bold">SaFara Tourist ID</h2>
// //           </div>
// //           <Badge className={getStatusColor(touristId.status)}>
// //             {getStatusIcon(touristId.status)}
// //             <span className="ml-1 capitalize">{touristId.status}</span>
// //           </Badge>
// //         </div>
// //       </Card>

// //       {/* QR Code */}
// //       <Card className="p-6">
// //         <div className="text-center space-y-4">
// //           <div className="mx-auto w-fit">
// //             <canvas 
// //               ref={canvasRef}
// //               className="border rounded-lg"
// //               style={{ maxWidth: '200px', height: 'auto' }}
// //             />
// //             {!qrGenerated && (
// //               <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
// //                 <QrCode className="w-8 h-8 text-muted-foreground animate-pulse" />
// //               </div>
// //             )}
// //           </div>
          
// //           <div className="text-sm text-muted-foreground">
// //             Scan with any QR reader for instant verification
// //           </div>
// //         </div>
// //       </Card>

// //       {/* ID Details */}
// //       <Card className="p-4 space-y-3">
// //         <div className="flex justify-between items-center">
// //           <span className="text-sm text-muted-foreground">ID Number:</span>
// //           <span className="font-mono text-sm">{personal.pid_full_name}</span>
// //         </div>
        
// //         <div className="flex justify-between items-center">
// //           <span className="text-sm text-muted-foreground">Holder:</span>
// //           <span className="font-medium text-sm">{touristId.holderName}</span>
// //         </div>
        
// //         <div className="flex justify-between items-center">
// //           <span className="text-sm text-muted-foreground">Destination:</span>
// //           <span className="font-medium text-sm">{touristId.destination}</span>
// //         </div>
        
// //         <div className="flex justify-between items-center">
// //           <span className="text-sm text-muted-foreground">Issued:</span>
// //           <span className="text-sm">18/09/2025</span>
// //         </div>
        
// //         <div className="flex justify-between items-center">
// //           <span className="text-sm text-muted-foreground">Valid Until:</span>
// //           <span className="text-sm">{validUntil.toLocaleDateString()}</span>
// //         </div>
        
// //         <div className="flex justify-between items-center pt-2 border-t">
// //           <span className="text-sm text-muted-foreground flex items-center gap-1">
// //             <Clock className="w-4 h-4" />
// //             Time Remaining:
// //           </span>
// //           <span className={`text-sm font-medium ${
// //             timeRemaining === 'Expired' ? 'text-safety-red' : 
// //             timeRemaining.includes('h') && !timeRemaining.includes('d') ? 'text-safety-yellow' : 
// //             'text-safety-green'
// //           }`}>
// //             {timeRemaining}
// //           </span>
// //         </div>
// //       </Card>

// //       {/* Actions */}
// //       <div className="flex gap-2">
// //         <Button 
// //           variant="outline" 
// //           className="flex-1" 
// //           onClick={handleDownload}
// //           disabled={!qrGenerated}
// //           data-testid="button-download"
// //         >
// //           <Download className="w-4 h-4 mr-2" />
// //           Download
// //         </Button>
        
// //         <Button 
// //           variant="outline" 
// //           className="flex-1" 
// //           onClick={handleShare}
// //           disabled={!qrGenerated || !navigator.share}
// //           data-testid="button-share"
// //         >
// //           <Share2 className="w-4 h-4 mr-2" />
// //           Share
// //         </Button>
// //       </div>

// //       {/* Verification Info */}
// //       <Card className="p-4 bg-primary/5 border-primary/20">
// //         <div className="flex items-start gap-3">
// //           <Shield className="w-5 h-5 text-primary mt-0.5" />
// //           <div>
// //             <h4 className="font-medium text-sm mb-1">Verification Details</h4>
// //             <ul className="text-xs text-muted-foreground space-y-1">
// //               <li>• Uses W3C Verifiable Credential standard</li>
// //               <li>• Cryptographically signed by SaFara authority</li>
// //               <li>• Works offline for instant verification</li>
// //               <li>• Tamper-proof digital credentials</li>
// //               <li>• Accepted by all registered tourism partners</li>
// //             </ul>
// //           </div>
// //         </div>
// //       </Card>
// //     </div>
// //   );
// // }

// // import { useEffect, useState } from 'react';
// // import { Card } from '@/components/ui/card';
// // import { Button } from '@/components/ui/button';
// // import { Badge } from '@/components/ui/badge';
// // import {
// //   QrCode,
// //   Download,
// //   Share2,
// //   Shield,
// //   Clock,
// //   CheckCircle,
// //   AlertTriangle,
// // } from 'lucide-react';

// // interface TouristIdData {
// //   id: string;
// //   destination: string;
// //   validUntil: Date | string;
// //   status: 'active' | 'expiring' | 'expired';
// //   holderName: string;
// //   issueDate: Date | string;
// // }
// // import { touristSocketManager } from "@/lib/touristSocket";





// // export default function QRCodeDisplay({ touristId }: { touristId: TouristIdData }) {
// //   const [timeRemaining, setTimeRemaining] = useState('');

// //   const issueDate = new Date(touristId.issueDate);
// //   const validUntil = new Date(touristId.validUntil);
// // // Start sending data every 1 minute
// // touristSocketManager.startSendingData(touristData);
// //   // ✅ Update time remaining
// //   useEffect(() => {
// //     const updateTimeRemaining = () => {
// //       const now = new Date();
// //       const diff = validUntil.getTime() - now.getTime();

// //       if (diff <= 0) return setTimeRemaining('Expired');

// //       const days = Math.floor(diff / (1000 * 60 * 60 * 24));
// //       const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
// //       setTimeRemaining(days > 0 ? `${days}d ${hours}h remaining` : `${hours}h remaining`);
// //     };

// //     updateTimeRemaining();
// //     const interval = setInterval(updateTimeRemaining, 60000);
// //     return () => clearInterval(interval);
// //   }, [validUntil]);

// //   const getStatusColor = (status: string) => {
// //     switch (status) {
// //       case 'active': return 'bg-green-600 text-white';
// //       case 'expiring': return 'bg-yellow-500 text-black';
// //       case 'expired': return 'bg-red-600 text-white';
// //       default: return 'bg-gray-500 text-white';
// //     }
// //   };

// //   const getStatusIcon = (status: string) => {
// //     switch (status) {
// //       case 'active': return <CheckCircle className="w-4 h-4" />;
// //       case 'expiring': return <AlertTriangle className="w-4 h-4" />;
// //       case 'expired': return <AlertTriangle className="w-4 h-4" />;
// //       default: return <Shield className="w-4 h-4" />;
// //     }
// //   };

// //   // ✅ Handle dummy actions
// //   const handleDownload = () => alert('Demo QR downloaded!');
// //   const handleShare = () => alert('Demo QR shared!');

// //   return (
// //     <div className="max-w-sm mx-auto p-4 space-y-4">
// //       <Card className="p-4 text-center">
// //         <div className="flex justify-center items-center gap-2">
// //           <Shield className="w-6 h-6 text-primary" />
// //           <h2 className="font-bold text-lg">SaFara Tourist ID</h2>
// //         </div>
// //         <Badge className={`${getStatusColor(touristId.status)} mt-2`}>
// //           {getStatusIcon(touristId.status)} <span className="ml-1 capitalize">{touristId.status}</span>
// //         </Badge>
// //       </Card>

// //       {/* ✅ Static Demo QR */}
// //       <Card className="p-6 text-center">
// //         <div className="mx-auto w-fit">
// //           <div className="w-56 h-56 bg-white border rounded-lg flex items-center justify-center shadow">
// //             <QrCode className="w-16 h-16 text-gray-600" />
// //           </div>
// //         </div>
// //         <p className="text-sm text-muted-foreground mt-3">Demo QR Display</p>
// //       </Card>

// //       {/* ✅ Tourist Info */}
// //       <Card className="p-4 space-y-2">
// //         <div className="flex justify-between"><span>ID:</span><span className="font-mono">{touristId.id}</span></div>
// //         <div className="flex justify-between"><span>Holder:</span><span>{touristId.holderName}</span></div>
// //         <div className="flex justify-between"><span>Destination:</span><span>{touristId.destination}</span></div>
// //         <div className="flex justify-between"><span>Valid Until:</span><span>{validUntil.toLocaleDateString()}</span></div>
// //         <div className="flex justify-between border-t pt-2">
// //           <span className="flex items-center gap-1 text-muted-foreground text-sm">
// //             <Clock className="w-4 h-4" /> Time left:
// //           </span>
// //           <span className={`font-medium ${timeRemaining === 'Expired' ? 'text-red-600' : 'text-green-600'}`}>
// //             {timeRemaining}
// //           </span>
// //         </div>
// //       </Card>

// //       {/* ✅ Actions */}
// //       <div className="flex gap-2">
// //         <Button variant="outline" onClick={handleDownload}>
// //           <Download className="w-4 h-4 mr-2" /> Download
// //         </Button>
// //         <Button variant="outline" onClick={handleShare}>
// //           <Share2 className="w-4 h-4 mr-2" /> Share
// //         </Button>
// //       </div>
// //     </div>
// //   );
// // }


// import { useEffect, useState } from 'react';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { QrCode, Download, Share2, Shield, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
// import { touristSocketManager } from "@/lib/touristSocket";

// interface TouristIdData {
//   id: string;
//   destination: string;
//   validUntil: Date | string;
//   status: 'active' | 'expiring' | 'expired';
//   holderName: string;
//   issueDate: Date | string;
// }

// export default function QRCodeDisplay({ touristId }: { touristId: TouristIdData }) {
//   const [timeRemaining, setTimeRemaining] = useState('');

//   const issueDate = new Date(touristId.issueDate);
//   const validUntil = new Date(touristId.validUntil);
//   // ✅ Send tourist data continuously via socket
//   useEffect(() => {
//     // Prepare data to send
//     const dataToSend = {
//       id: touristId.id,
//       holderName: touristId.holderName,
//       destination: touristId.destination,
//       status: touristId.status,
//       issueDate: touristId.issueDate,
//       validUntil: touristId.validUntil,
//     };

//     // Start sending data
//     touristSocketManager.startSendingData(dataToSend, 60000); // every 1 min

//     // Cleanup on unmount
//     return () => {
//       touristSocketManager.stopSendingData();
//     };
//   }, [touristId]);

//   // ✅ Update time remaining
//   useEffect(() => {
//     const updateTimeRemaining = () => {
//       const now = new Date();
//       const diff = validUntil.getTime() - now.getTime();
//       if (diff <= 0) return setTimeRemaining('Expired');

//       const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//       const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//       setTimeRemaining(days > 0 ? `${days}d ${hours}h remaining` : `${hours}h remaining`);
//     };

//     updateTimeRemaining();
//     const interval = setInterval(updateTimeRemaining, 60000);
//     return () => clearInterval(interval);
//   }, [validUntil]);

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'active': return 'bg-green-600 text-white';
//       case 'expiring': return 'bg-yellow-500 text-black';
//       case 'expired': return 'bg-red-600 text-white';
//       default: return 'bg-gray-500 text-white';
//     }
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case 'active': return <CheckCircle className="w-4 h-4" />;
//       case 'expiring': return <AlertTriangle className="w-4 h-4" />;
//       case 'expired': return <AlertTriangle className="w-4 h-4" />;
//       default: return <Shield className="w-4 h-4" />;
//     }
//   };

//   const handleDownload = () => alert('Demo QR downloaded!');
//   const handleShare = () => alert('Demo QR shared!');

//   return (
//     <div className="max-w-sm mx-auto p-4 space-y-4">
//       <Card className="p-4 text-center">
//         <div className="flex justify-center items-center gap-2">
//           <Shield className="w-6 h-6 text-primary" />
//           <h2 className="font-bold text-lg">SaFara Tourist ID</h2>
//         </div>
//         <Badge className={`${getStatusColor(touristId.status)} mt-2`}>
//           {getStatusIcon(touristId.status)} <span className="ml-1 capitalize">{touristId.status}</span>
//         </Badge>
//       </Card>

//       {/* Static QR */}
//       <Card className="p-6 text-center">
//         <div className="mx-auto w-fit">
//           <div className="w-56 h-56 bg-white border rounded-lg flex items-center justify-center shadow">
//             <QrCode className="w-16 h-16 text-gray-600" />
//           </div>
//         </div>
//         <p className="text-sm text-muted-foreground mt-3">Demo QR Display</p>
//       </Card>

//       {/* Tourist Info */}
//       <Card className="p-4 space-y-2">
//         <div className="flex justify-between"><span>ID:</span><span className="font-mono">{touristId.id}</span></div>
//         <div className="flex justify-between"><span>Holder:</span><span>{touristId.holderName}</span></div>
//         <div className="flex justify-between"><span>Destination:</span><span>{touristId.destination}</span></div>
//         <div className="flex justify-between"><span>Valid Until:</span><span>{validUntil.toLocaleDateString()}</span></div>
//         <div className="flex justify-between border-t pt-2">
//           <span className="flex items-center gap-1 text-muted-foreground text-sm"><Clock className="w-4 h-4" /> Time left:</span>
//           <span className={`font-medium ${timeRemaining === 'Expired' ? 'text-red-600' : 'text-green-600'}`}>{timeRemaining}</span>
//         </div>
//       </Card>

//       {/* Actions */}
//       <div className="flex gap-2">
//         <Button variant="outline" onClick={handleDownload}><Download className="w-4 h-4 mr-2" /> Download</Button>
//         <Button variant="outline" onClick={handleShare}><Share2 className="w-4 h-4 mr-2" /> Share</Button>
//       </div>
//     </div>
//   );
// }


import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Download, Share2, Shield, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { touristSocketManager } from "@/lib/touristSocket";
import { QRCodeCanvas } from "qrcode.react";


interface TouristIdData {
  id: string;
  destination: string;
  validUntil: Date | string;
  status: 'active' | 'expiring' | 'expired';
  holderName: string;
  issueDate: Date | string;
}

export default function QRCodeDisplay({ touristId }: { touristId: TouristIdData }) {
  const [timeRemaining, setTimeRemaining] = useState('');

  const issueDate = new Date(touristId.issueDate);
  const validUntil = new Date(touristId.validUntil);
  const PUBLIC_URL = import.meta.env.VITE_FRONTEND_BASE_URL;

  // ✅ Send tourist data continuously via socket
  // useEffect(() => {
  //   // Prepare data to send
  //   const dataToSend = {
  //     id: touristId.id,
  //     holderName: touristId.holderName,
  //     destination: touristId.destination,
  //     status: touristId.status,
  //     issueDate: touristId.issueDate,
  //     validUntil: touristId.validUntil,
  //   };

  //   // Start sending data
  //   touristSocketManager.startSendingData(dataToSend, 60000); // every 1 min

  //   // Cleanup on unmount
  //   return () => {
  //     touristSocketManager.stopSendingData();
  //   };
  // }, [touristId]);
useEffect(() => {
  if (!touristId) return;

  const dataToSend = {
    id: touristId.id,
    holderName: touristId.holderName,
    destination: touristId.destination,
    status: touristId.status,
    issueDate: new Date(touristId.issueDate).toISOString(),
    validUntil: new Date(touristId.validUntil).toISOString(),
  };

  touristSocketManager.startSendingData(dataToSend, 60000);

  return () => {
    touristSocketManager.stopSendingData();
  };
}, [touristId]);

  // ✅ Update time remaining
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const diff = validUntil.getTime() - now.getTime();
      if (diff <= 0) return setTimeRemaining('Expired');

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeRemaining(days > 0 ? `${days}d ${hours}h remaining` : `${hours}h remaining`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, [validUntil]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600 text-white';
      case 'expiring': return 'bg-yellow-500 text-black';
      case 'expired': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'expiring': return <AlertTriangle className="w-4 h-4" />;
      case 'expired': return <AlertTriangle className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  // Download the QR as PNG or JPG
const handleDownload = (format: "png" | "jpeg") => {
  const canvas = document.querySelector("canvas");
  if (!canvas) return alert("QR not generated");

  const mime = format === "png" ? "image/png" : "image/jpeg";
  const imageURL = canvas.toDataURL(mime);

  const link = document.createElement("a");
  link.href = imageURL;
  link.download = `tourist-qr.${format}`;
  link.click();
};


  const handleShare = async () => {
  const canvas = document.querySelector("canvas");
  if (!canvas) return alert("QR not generated");

  canvas.toBlob(async (blob) => {
    if (!blob) return alert("Could not create file");

    const file = new File([blob], "tourist-qr.png", { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: "Tourist QR",
          text: "Scan this QR to view tourist details",
          files: [file],
        });
      } catch {
        alert("Share cancelled");
      }
    } else {
      // fallback: download instead
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tourist-qr.png";
      a.click();
      URL.revokeObjectURL(url);

      alert("Your browser does not support sharing. Downloaded instead.");
    }
  });
};


  return (
    <div className="max-w-sm mx-auto p-4 space-y-4">
      <Card className="p-4 text-center">
        <div className="flex justify-center items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <h2 className="font-bold text-lg">SaFara Tourist ID</h2>
        </div>
        <Badge className={`${getStatusColor(touristId.status)} mt-2`}>
          {getStatusIcon(touristId.status)} <span className="ml-1 capitalize">{touristId.status}</span>
        </Badge>
      </Card>

{/* REAL QR CODE */}
<Card className="p-6 text-center">
  <div className="mx-auto w-fit">
    <QRCodeCanvas 
      value={`http://localhost:5173/tourist/${touristId.id}`} 
      size={220}
      bgColor="#FFFFFF"
      fgColor="#000000"
      level="H"
      includeMargin={true}
      className="rounded-lg shadow"
    />
  </div>
  <p className="text-sm text-muted-foreground mt-3">Scan to view tourist details</p>
</Card>


      {/* Tourist Info */}
      <Card className="p-4 space-y-2">
        <div className="flex justify-between"><span>ID:</span><span className="font-mono">{touristId.id}</span></div>
        <div className="flex justify-between"><span>Holder:</span><span>{touristId.holderName}</span></div>
        <div className="flex justify-between"><span>Destination:</span><span>{touristId.destination}</span></div>
        <div className="flex justify-between"><span>Valid Until:</span><span>{validUntil.toLocaleDateString()}</span></div>
        <div className="flex justify-between border-t pt-2">
          <span className="flex items-center gap-1 text-muted-foreground text-sm"><Clock className="w-4 h-4" /> Time left:</span>
          <span className={`font-medium ${timeRemaining === 'Expired' ? 'text-red-600' : 'text-green-600'}`}>{timeRemaining}</span>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
  <Button variant="outline" onClick={() => handleDownload("png")}>
    <Download className="w-4 h-4 mr-2" /> Download PNG
  </Button>

  <Button variant="outline" onClick={() => handleDownload("jpeg")}>
    <Download className="w-4 h-4 mr-2" /> Download JPG
  </Button>

  <Button variant="outline" onClick={handleShare}>
    <Share2 className="w-4 h-4 mr-2" /> Share
  </Button>
</div>


    </div>
  );
}