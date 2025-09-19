import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Camera, Image } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VirtualTryOnModal({ isOpen, onClose, onEnableTryOn, products }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length > 0) handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files); // keep preview UI
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleFiles = (files) => {
    const remainingSlots = 3 - uploadedFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);
    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedFiles(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          preview: ev.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
    // also remove from selectedFiles if necessary (by filename)
    setSelectedFiles(prev => prev.filter(sf => !prev.some(f => f.id === id)));
  };

  // When user clicks Enable Try-On: call parent to do upload + websocket
  const handleSubmit = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setIsProcessing(true);
    try {
      // call parent handler with selected files
      await onEnableTryOn(selectedFiles);
      // parent will close modal (as implemented), but keep this UI safe
    } catch (err) {
      console.error("Modal: onEnableTryOn failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    onClose();
    setUploadedFiles([]);
    setSelectedFiles([]);
    setIsProcessing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Camera className="w-6 h-6" />
            Virtual Try-On Experience
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Upload area */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Upload Your Photos</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload up to 3 photos of yourself to see how our dresses look on you.
              {uploadedFiles.length > 0 && (
                <span className="block mt-1 text-purple-600 font-medium">
                  Processing time: approximately {uploadedFiles.length * 3} seconds
                </span>
              )}
            </p>

            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive ? "border-blue-400 bg-blue-50" :
                uploadedFiles.length >= 3 ? "border-gray-200 bg-gray-50" : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploadedFiles.length >= 3 || isProcessing}
              />
              <div className="space-y-2">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <p className="text-lg font-medium">
                  {uploadedFiles.length >= 3 ? 'Maximum photos reached' : 'Drop photos here or click to browse'}
                </p>
                <p className="text-sm text-gray-500">
                  {uploadedFiles.length}/3 photos uploaded • PNG, JPG, JPEG
                </p>
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="relative">
                    <img src={file.preview} alt="Uploaded" className="w-full h-32 object-cover rounded-lg border" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-6 h-6"
                      onClick={() => removeFile(file.id)}
                      disabled={isProcessing}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Privacy card omitted for brevity (unchanged) */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Image className="w-5 h-5" />
                Privacy & Data Protection
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p><strong>Your privacy is our priority.</strong></p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2"><span className="text-green-600 mt-0.5">•</span><span>Photos are processed securely and are never stored permanently</span></li>
                  <li className="flex items-start gap-2"><span className="text-green-600 mt-0.5">•</span><span>Images are automatically deleted after your session ends</span></li>
                  <li className="flex items-start gap-2"><span className="text-green-600 mt-0.5">•</span><span>We don't share your photos with third parties</span></li>
                </ul>
                <Alert className="mt-4">
                  <AlertDescription className="text-xs">
                    By using Virtual Try-On, you agree to our processing of your images for styling purposes only.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1" disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={uploadedFiles.length === 0 || isProcessing} className="flex-1 bg-purple-600 hover:bg-purple-700">
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : 'Enable Try-On'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
