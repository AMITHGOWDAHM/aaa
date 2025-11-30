import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useWeb3 } from '@/contexts/Web3Context';
import { Upload as UploadIcon, File, X, Plus, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { IPFSService } from '@/services/ipfsService';
import { supabase } from '@/integrations/supabase/client';


// Define interfaces for type safety
interface FormData {
  name: string;
  description: string;
  price: string;
  category: string;
  tags: string[];
  currentTag: string;
}

interface DatasetMetadata {
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  ipfs_hash: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploader_address: string;
  upload_timestamp: string;
  preview_data?: string | null;
  preview_image_hash?: string | null;
  status?: string;
}

const Upload = () => {
  const { isConnected, account } = useWeb3();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    category: '',
    tags: [],
    currentTag: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState('');
  const [datasetContext, setDatasetContext] = useState<any | null>(null);
  const [priceLocked, setPriceLocked] = useState(false);

  const categories = ['Business', 'Science', 'Finance', 'Technology', 'Healthcare', 'Education', 'Other'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['text/csv', 'application/json'];
    const maxSize = 100 * 1024 * 1024; // 100MB

    if (!allowedTypes.includes(file.type)) {
      toast({ 
        title: "Invalid File Type", 
        description: "Upload CSV or JSON only", 
        variant: "destructive" 
      });
      return;
    }

    if (file.size > maxSize) {
      toast({ 
        title: "File Too Large", 
        description: "Max size is 100MB", 
        variant: "destructive" 
      });
      return;
    }

    setSelectedFile(file);
  };

  // Load dataset info from localStorage if present (pre-fill fields when redirected from analyzer)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('datasetInfo');
      if (!raw) return;
      const info = JSON.parse(raw);
      setDatasetContext(info);
      if (info.fileName && !formData.name) {
        // Pre-fill dataset name (remove extension)
        const name = String(info.fileName).replace(/\.[^/.]+$/, '');
        setFormData(prev => ({ ...prev, name }));
      }
      if (info.suggestedPrice !== undefined && info.suggestedPrice !== null) {
        setFormData(prev => ({ ...prev, price: String(info.suggestedPrice) }));
      }
      if (info.previewData) setPreviewData(info.previewData);
      if (info.priceLocked) setPriceLocked(true);
    } catch (err) {
      // ignore
    }
  }, []);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB for images

    if (!allowedTypes.includes(file.type)) {
      toast({ 
        title: "Invalid Image Type", 
        description: "Upload JPEG, PNG, WebP, or GIF only", 
        variant: "destructive" 
      });
      return;
    }

    if (file.size > maxSize) {
      toast({ 
        title: "Image Too Large", 
        description: "Max size is 10MB", 
        variant: "destructive" 
      });
      return;
    }

    setSelectedImage(file);
  };

  const addTag = () => {
    const trimmedTag = formData.currentTag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag],
        currentTag: '',
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({ title: "Missing Name", description: "Please enter a dataset name", variant: "destructive" });
      return false;
    }
    if (!formData.description.trim()) {
      toast({ title: "Missing Description", description: "Please enter a description", variant: "destructive" });
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({ title: "Invalid Price", description: "Please enter a valid price greater than 0", variant: "destructive" });
      return false;
    }
    if (!formData.category) {
      toast({ title: "Missing Category", description: "Please select a category", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    if (!isConnected) {
      toast({ 
        title: "Wallet Not Connected", 
        description: "Connect MetaMask to upload.", 
        variant: "destructive" 
      });
      return;
    }

    if (!selectedFile) {
      toast({ 
        title: "No File Selected", 
        description: "Please select a dataset file to upload.", 
        variant: "destructive" 
      });
      return;
    }

    if (!account) {
      toast({ 
        title: "No Account", 
        description: "Unable to get wallet address.", 
        variant: "destructive" 
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Upload main file to IPFS
      console.log('Uploading file to IPFS...');
      const ipfsHash = await IPFSService.uploadFile(selectedFile);
      console.log('File uploaded to IPFS:', ipfsHash);

      // Step 2: Upload image to IPFS if provided
      let imageHash: string | null = null;
      if (selectedImage) {
        console.log('Uploading image to IPFS...');
        imageHash = await IPFSService.uploadFile(selectedImage);
        console.log('Image uploaded to IPFS:', imageHash);
      }

      // Step 3: Prepare metadata for Supabase
      const datasetMetadata: DatasetMetadata = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        tags: formData.tags,
        ipfs_hash: ipfsHash,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        uploader_address: account,
        upload_timestamp: new Date().toISOString(),
        preview_data: previewData.trim() || null,
        preview_image_hash: imageHash,
        status: 'active'
      };

      console.log('Saving to Supabase...', datasetMetadata);

      // Step 4: Insert into Supabase
      const { data, error } = await supabase
        .from('datasets')
        .insert([datasetMetadata])
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Successfully saved to Supabase:', data);

      // Success toast
      toast({
        title: "Dataset Uploaded Successfully!",
        description: `Your dataset "${formData.name}" has been uploaded to IPFS and saved to the marketplace.`,
        variant: "default",
      });

      // Reset form
      setFormData({ 
        name: '', 
        description: '', 
        price: '', 
        category: '', 
        tags: [], 
        currentTag: '' 
      });
      setSelectedFile(null);
      setSelectedImage(null);
      setPreviewData('');

    } catch (error) {
      console.error('Upload error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An unexpected error occurred. Please try again.";
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Wallet not connected view
  if (!isConnected) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="bg-black/40 border-purple-500/20">
            <CardContent className="p-12">
              <UploadIcon className="w-16 h-16 mx-auto mb-4 text-purple-400" />
              <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">
                You need to connect your MetaMask wallet to upload datasets to the marketplace.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Upload Dataset</h1>
          <p className="text-gray-300 text-lg">Share your data with the world and earn crypto</p>
        </div>

        <Card className="bg-black/40 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <UploadIcon className="w-6 h-6 mr-2 text-purple-400" />
              Dataset Information
            </CardTitle>
          </CardHeader>

          <CardContent>
            {
              datasetContext && (
                <div className="mb-4 p-4 rounded-lg bg-purple-800/40 border border-purple-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-purple-200">Detected from Analyzer</div>
                      <div className="text-lg font-semibold">{datasetContext.fileName || 'Dataset'}</div>
                      <div className="text-sm text-gray-300">{datasetContext.datasetSize?.toLocaleString?.() || datasetContext.datasetSize} rows</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-200">Quality Score</div>
                      <div className="text-2xl font-bold">{datasetContext.qualityScore ?? 'N/A'}</div>
                      <div className="text-sm text-gray-300">{datasetContext.qualityLabel || ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-200">Suggested Price</div>
                      <div className="text-2xl font-bold">{datasetContext.suggestedPrice ?? '—'}</div>
                      {priceLocked && <div className="text-xs text-yellow-200">Price locked by Analyzer</div>}
                    </div>
                  </div>
                </div>
              )
            }

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dataset File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file" className="text-white">Dataset File *</Label>
                <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center hover:border-purple-500/50 transition-colors">
                  <input 
                    type="file" 
                    id="file" 
                    accept=".csv,.json" 
                    onChange={handleFileSelect} 
                    className="hidden"
                    disabled={isUploading}
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center space-x-3">
                      <File className="w-8 h-8 text-purple-400" />
                      <div className="text-left">
                        <p className="text-white font-medium">{selectedFile.name}</p>
                        <p className="text-gray-400 text-sm">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedFile(null)} 
                        className="text-gray-400 hover:text-red-400"
                        disabled={isUploading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="file" className={`cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <UploadIcon className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                      <p className="text-white mb-2">Click to upload or drag and drop</p>
                      <p className="text-gray-400 text-sm">CSV or JSON files only (max 100MB)</p>
                    </label>
                  )}
                </div>
              </div>

              {/* Preview Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image" className="text-white">Preview Image (Optional)</Label>
                <div className="border-2 border-dashed border-blue-500/30 rounded-lg p-6 text-center hover:border-blue-500/50 transition-colors">
                  <input 
                    type="file" 
                    id="image" 
                    accept=".jpg,.jpeg,.png,.webp,.gif" 
                    onChange={handleImageSelect} 
                    className="hidden"
                    disabled={isUploading}
                  />
                  {selectedImage ? (
                    <div className="flex items-center justify-center space-x-3">
                      <Image className="w-8 h-8 text-blue-400" />
                      <div className="text-left">
                        <p className="text-white font-medium">{selectedImage.name}</p>
                        <p className="text-gray-400 text-sm">
                          {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedImage(null)} 
                        className="text-gray-400 hover:text-red-400"
                        disabled={isUploading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="image" className={`cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Image className="w-10 h-10 mx-auto mb-3 text-blue-400" />
                      <p className="text-white mb-2">Upload a preview image</p>
                      <p className="text-gray-400 text-sm">JPEG, PNG, WebP, or GIF (max 10MB)</p>
                    </label>
                  )}
                </div>
              </div>

              {/* Preview Data */}
              <div className="space-y-2">
                <Label htmlFor="preview" className="text-white">Dataset Preview (Optional)</Label>
                <Textarea
                  id="preview"
                  value={previewData}
                  onChange={(e) => setPreviewData(e.target.value)}
                  placeholder="Paste a sample of your dataset here (first few rows of CSV or JSON structure)..."
                  className="bg-black/40 border-green-500/20 text-white min-h-[100px] font-mono text-sm"
                  disabled={isUploading}
                />
              </div>

              {/* Dataset Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Dataset Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="bg-black/40 border-purple-500/20 text-white"
                  placeholder="Enter dataset name"
                  disabled={isUploading}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  className="bg-black/40 border-purple-500/20 text-white min-h-[100px]"
                  placeholder="Describe your dataset..."
                  disabled={isUploading}
                />
              </div>

              {/* Price and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-white">Price (ETH) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.001"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                    className="bg-black/40 border-purple-500/20 text-white"
                    placeholder="0.001"
                    disabled={isUploading || priceLocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-white">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    disabled={isUploading}
                  >
                    <SelectTrigger className="bg-black/40 border-purple-500/20 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-white">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.currentTag}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentTag: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a tag..."
                    className="bg-black/40 border-purple-500/20 text-white flex-1"
                    disabled={isUploading}
                  />
                  <Button 
                    type="button" 
                    onClick={addTag} 
                    variant="outline" 
                    size="icon" 
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                    disabled={isUploading}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-purple-500/20 text-purple-300 pr-1">
                        {tag}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeTag(tag)} 
                          className="ml-1 h-auto p-0 text-purple-300 hover:text-red-400"
                          disabled={isUploading}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isUploading || !selectedFile} 
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-3"
              >
                {isUploading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <UploadIcon className="w-5 h-5 mr-2" />
                    Upload Dataset
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Upload;