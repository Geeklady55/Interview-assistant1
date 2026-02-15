import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Code,
  Copy,
  Check,
  ArrowLeft,
  Send,
  Loader2,
  Shield,
  Play,
  Trash2,
  FileCode,
  MessageSquare,
  History,
  Download,
  FileText,
  Eye,
  EyeOff,
  GripVertical,
  Minimize2,
  Maximize2,
  X,
  Zap,
  BookOpen,
  Volume2,
  Square,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Assessment code templates
const ASSESSMENT_TEMPLATES = {
  "two-sum": {
    name: "Two Sum",
    difficulty: "Easy",
    description: "Find two numbers that add up to target",
    javascript: `// Two Sum - Find indices of two numbers that add up to target
// Time: O(n), Space: O(n)
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Example: twoSum([2,7,11,15], 9) => [0,1]`,
    python: `# Two Sum - Find indices of two numbers that add up to target
# Time: O(n), Space: O(n)
def two_sum(nums, target):
    num_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i
    return []

# Example: two_sum([2,7,11,15], 9) => [0,1]`,
  },
  "binary-search": {
    name: "Binary Search",
    difficulty: "Easy",
    description: "Search in sorted array",
    javascript: `// Binary Search - Find target in sorted array
// Time: O(log n), Space: O(1)
function binarySearch(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

// Example: binarySearch([1,2,3,4,5], 3) => 2`,
    python: `# Binary Search - Find target in sorted array
# Time: O(log n), Space: O(1)
def binary_search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

# Example: binary_search([1,2,3,4,5], 3) => 2`,
  },
  "reverse-linked-list": {
    name: "Reverse Linked List",
    difficulty: "Easy",
    description: "Reverse a singly linked list",
    javascript: `// Reverse Linked List
// Time: O(n), Space: O(1)
function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}

// ListNode definition
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}`,
    python: `# Reverse Linked List
# Time: O(n), Space: O(1)
def reverse_list(head):
    prev = None
    curr = head
    while curr:
        next_node = curr.next
        curr.next = prev
        prev = curr
        curr = next_node
    return prev

# ListNode definition
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next`,
  },
  "valid-parentheses": {
    name: "Valid Parentheses",
    difficulty: "Easy",
    description: "Check if parentheses are balanced",
    javascript: `// Valid Parentheses - Check if brackets are balanced
// Time: O(n), Space: O(n)
function isValid(s) {
  const stack = [];
  const pairs = { ')': '(', '}': '{', ']': '[' };
  
  for (const char of s) {
    if ('({['.includes(char)) {
      stack.push(char);
    } else {
      if (stack.pop() !== pairs[char]) return false;
    }
  }
  return stack.length === 0;
}

// Example: isValid("()[]{}") => true`,
    python: `# Valid Parentheses - Check if brackets are balanced
# Time: O(n), Space: O(n)
def is_valid(s):
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    
    for char in s:
        if char in '({[':
            stack.append(char)
        else:
            if not stack or stack.pop() != pairs[char]:
                return False
    return len(stack) == 0

# Example: is_valid("()[]{}") => True`,
  },
  "merge-sorted-arrays": {
    name: "Merge Sorted Arrays",
    difficulty: "Easy",
    description: "Merge two sorted arrays in-place",
    javascript: `// Merge Sorted Arrays - Merge nums2 into nums1
// Time: O(m+n), Space: O(1)
function merge(nums1, m, nums2, n) {
  let p1 = m - 1, p2 = n - 1, p = m + n - 1;
  
  while (p2 >= 0) {
    if (p1 >= 0 && nums1[p1] > nums2[p2]) {
      nums1[p--] = nums1[p1--];
    } else {
      nums1[p--] = nums2[p2--];
    }
  }
}

// Example: merge([1,2,3,0,0,0], 3, [2,5,6], 3)`,
    python: `# Merge Sorted Arrays - Merge nums2 into nums1
# Time: O(m+n), Space: O(1)
def merge(nums1, m, nums2, n):
    p1, p2, p = m - 1, n - 1, m + n - 1
    
    while p2 >= 0:
        if p1 >= 0 and nums1[p1] > nums2[p2]:
            nums1[p] = nums1[p1]
            p1 -= 1
        else:
            nums1[p] = nums2[p2]
            p2 -= 1
        p -= 1

# Example: merge([1,2,3,0,0,0], 3, [2,5,6], 3)`,
  },
  "max-subarray": {
    name: "Maximum Subarray (Kadane)",
    difficulty: "Medium",
    description: "Find contiguous subarray with largest sum",
    javascript: `// Maximum Subarray - Kadane's Algorithm
// Time: O(n), Space: O(1)
function maxSubArray(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];
  
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}

// Example: maxSubArray([-2,1,-3,4,-1,2,1,-5,4]) => 6`,
    python: `# Maximum Subarray - Kadane's Algorithm
# Time: O(n), Space: O(1)
def max_sub_array(nums):
    max_sum = current_sum = nums[0]
    
    for num in nums[1:]:
        current_sum = max(num, current_sum + num)
        max_sum = max(max_sum, current_sum)
    return max_sum

# Example: max_sub_array([-2,1,-3,4,-1,2,1,-5,4]) => 6`,
  },
  "lru-cache": {
    name: "LRU Cache",
    difficulty: "Medium",
    description: "Least Recently Used cache implementation",
    javascript: `// LRU Cache - Least Recently Used
// Time: O(1) for get/put, Space: O(capacity)
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }
  
  get(key) {
    if (!this.cache.has(key)) return -1;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }
  
  put(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.capacity) {
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.set(key, value);
  }
}`,
    python: `# LRU Cache - Least Recently Used
# Time: O(1) for get/put, Space: O(capacity)
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = OrderedDict()
    
    def get(self, key):
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]
    
    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)`,
  },
  "dfs-bfs": {
    name: "DFS & BFS Tree Traversal",
    difficulty: "Medium",
    description: "Depth-first and breadth-first search",
    javascript: `// Tree Traversals - DFS & BFS
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// DFS - Inorder (Left, Root, Right)
function inorderDFS(root, result = []) {
  if (!root) return result;
  inorderDFS(root.left, result);
  result.push(root.val);
  inorderDFS(root.right, result);
  return result;
}

// BFS - Level Order
function levelOrderBFS(root) {
  if (!root) return [];
  const result = [], queue = [root];
  while (queue.length) {
    const level = [];
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}`,
    python: `# Tree Traversals - DFS & BFS
from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# DFS - Inorder (Left, Root, Right)
def inorder_dfs(root, result=None):
    if result is None:
        result = []
    if not root:
        return result
    inorder_dfs(root.left, result)
    result.append(root.val)
    inorder_dfs(root.right, result)
    return result

# BFS - Level Order
def level_order_bfs(root):
    if not root:
        return []
    result, queue = [], deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        result.append(level)
    return result`,
  },
};

// TTS Hook
const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeechId, setCurrentSpeechId] = useState(null);

  const speak = useCallback((text, id = null) => {
    window.speechSynthesis.cancel();
    if (!text) return;

    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/•/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\/\/.*/g, '') // Remove code comments
      .replace(/#.*/g, '') // Remove Python comments
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || v.name.includes('Natural')
    ) || voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => { setIsSpeaking(true); setCurrentSpeechId(id); };
    utterance.onend = () => { setIsSpeaking(false); setCurrentSpeechId(null); };
    utterance.onerror = () => { setIsSpeaking(false); setCurrentSpeechId(null); };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentSpeechId(null);
  }, []);

  useEffect(() => {
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.cancel();
  }, []);

  return { speak, stop, isSpeaking, currentSpeechId };
};

const CodeInterview = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  // TTS
  const { speak, stop, isSpeaking, currentSpeechId } = useTTS();

  // Session state
  const [session, setSession] = useState(null);

  // Code state
  const [code, setCode] = useState(`// Write your code here
function solution(nums) {
  // Your implementation
  return nums;
}
`);
  const [language, setLanguage] = useState("javascript");
  const [question, setQuestion] = useState("");

  // AI state
  const [aiModel, setAiModel] = useState("gpt-5.2");
  const [isGenerating, setIsGenerating] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [copied, setCopied] = useState(false);

  // Chat history
  const [chatHistory, setChatHistory] = useState([]);

  // Stealth mode state
  const [stealthMode, setStealthMode] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  // History dialog
  const [showHistory, setShowHistory] = useState(false);
  const [savedSessions, setSavedSessions] = useState([]);

  // Templates dialog
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
      loadSavedHistory();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await axios.get(`${API}/sessions/${sessionId}`);
      setSession(response.data);
    } catch (error) {
      console.error("Failed to fetch session:", error);
    }
  };

  const loadSavedHistory = () => {
    // Load from localStorage
    const saved = localStorage.getItem(`code_history_${sessionId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSavedSessions(parsed);
    }
  };

  const saveToHistory = () => {
    if (chatHistory.length === 0) {
      toast.error("No conversation to save");
      return;
    }

    const historyEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      code,
      language,
      chatHistory,
    };

    const updated = [...savedSessions, historyEntry];
    setSavedSessions(updated);
    localStorage.setItem(`code_history_${sessionId}`, JSON.stringify(updated));
    toast.success("Session saved to history!");
  };

  const loadFromHistory = (entry) => {
    setCode(entry.code);
    setLanguage(entry.language);
    setChatHistory(entry.chatHistory);
    setShowHistory(false);
    toast.success("Session restored!");
  };

  const deleteFromHistory = (id) => {
    const updated = savedSessions.filter(s => s.id !== id);
    setSavedSessions(updated);
    localStorage.setItem(`code_history_${sessionId}`, JSON.stringify(updated));
    toast.success("Deleted from history");
  };

  const exportTranscript = () => {
    if (chatHistory.length === 0) {
      toast.error("No conversation to export");
      return;
    }

    const transcript = `# Code Interview Transcript
Generated: ${new Date().toLocaleString()}
Language: ${language}

## Code
\`\`\`${language}
${code}
\`\`\`

## Conversation
${chatHistory.map(msg => `### ${msg.type === 'user' ? 'You' : 'AI'}\n${msg.content}`).join('\n\n')}
`;

    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-interview-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Transcript exported!");
  };

  const loadTemplate = (templateKey) => {
    const template = ASSESSMENT_TEMPLATES[templateKey];
    const langKey = language === 'python' ? 'python' : 'javascript';
    setCode(template[langKey] || template.javascript);
    setShowTemplates(false);
    toast.success(`Loaded: ${template.name}`);
  };

  const analyzeCode = async () => {
    if (!code.trim()) {
      toast.error("Please enter some code to analyze");
      return;
    }

    const userQuestion = question.trim() || "Explain this code and suggest improvements";

    setIsGenerating(true);
    setExplanation("");

    try {
      const response = await axios.post(`${API}/code-assist`, {
        code: code.trim(),
        language,
        question: userQuestion,
        ai_model: aiModel,
      });

      setExplanation(response.data.explanation);
      setChatHistory(prev => [
        ...prev,
        { type: "user", content: userQuestion, code: code.trim() },
        { type: "assistant", content: response.data.explanation },
      ]);
      setQuestion("");
    } catch (error) {
      console.error("Failed to analyze code:", error);
      toast.error("Failed to analyze code. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const askFollowUp = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setIsGenerating(true);

    try {
      const context = chatHistory
        .slice(-4)
        .map(msg => `${msg.type}: ${msg.content}`)
        .join("\n");

      const response = await axios.post(`${API}/generate-answer`, {
        question: question.trim(),
        ai_model: aiModel,
        tone: "technical",
        domain: "dsa",
        context: `Previous conversation:\n${context}\n\nCurrent code:\n${code}`,
        session_id: sessionId || null,
      });

      setChatHistory(prev => [
        ...prev,
        { type: "user", content: question.trim() },
        { type: "assistant", content: response.data.answer },
      ]);
      setExplanation(response.data.answer);
      setQuestion("");
    } catch (error) {
      console.error("Failed to get follow-up answer:", error);
      toast.error("Failed to get answer. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const clearCode = () => {
    setCode("");
    setExplanation("");
    setChatHistory([]);
  };

  // Drag handlers for stealth mode
  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX - position.x,
        startY: e.clientY - position.y,
      };
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging && dragRef.current) {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragRef.current.startX)),
        y: Math.max(0, Math.min(window.innerHeight - 300, e.clientY - dragRef.current.startY)),
      });
    }
  }, [isDragging]);

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (stealthMode) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [stealthMode, handleMouseMove]);

  const languageOptions = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "c", label: "C" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "sql", label: "SQL" },
  ];

  // Stealth Mode Overlay
  if (stealthMode) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed z-50"
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <Card className={`glass rounded-lg overflow-hidden ${!minimized && 'stealth-idle'}`}
          style={{ width: minimized ? '200px' : '500px', opacity: 0.95 }}>
          {/* Stealth Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-black/60 border-b border-white/10 drag-handle cursor-move">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-white/30" />
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-accent">STEALTH CODE</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setMinimized(!minimized)} className="h-6 w-6 p-0">
                {minimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStealthMode(false)} className="h-6 w-6 p-0 text-destructive">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {!minimized && (
            <CardContent className="p-3 max-h-[400px] overflow-auto">
              {/* Quick AI Buttons */}
              <div className="flex gap-2 mb-3">
                <Button size="sm" onClick={analyzeCode} disabled={isGenerating} className="flex-1 h-7 text-xs bg-primary">
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Zap className="w-3 h-3 mr-1" />Analyze</>}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setQuestion("Optimize this"); analyzeCode(); }} className="h-7 text-xs">
                  Optimize
                </Button>
              </div>

              {/* Code Input */}
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste code here..."
                className="h-24 text-xs font-mono bg-black/40 border-white/10 mb-3"
              />

              {/* Latest Response */}
              {explanation && (
                <div className="bg-black/40 rounded p-2 border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/50">AI Response</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => {
                            if (isSpeaking) stop(); else speak(explanation, 'stealth');
                          }} className="h-5 w-5 p-0">
                            {isSpeaking ? <Square className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{isSpeaking ? 'Stop' : 'Read aloud'}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-white/80 whitespace-pre-wrap max-h-32 overflow-auto">{explanation}</p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </motion.div>
    );
  }

  // Normal Mode
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              data-testid="back-btn"
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="text-white/70 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-accent" />
              <span className="font-secondary font-bold tracking-tight text-sm">
                {session?.name || "CODE INTERVIEW"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Templates Button */}
            <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
              <DialogTrigger asChild>
                <Button data-testid="templates-btn" variant="outline" size="sm" className="h-8 text-xs border-white/10 hover:border-accent/50">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Templates
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-surface border-white/10 max-w-2xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="font-secondary">Assessment Code Templates</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {Object.entries(ASSESSMENT_TEMPLATES).map(([key, template]) => (
                    <Card key={key} className="bg-black/40 border-white/10 cursor-pointer hover:border-accent/50 transition-colors" onClick={() => loadTemplate(key)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm">{template.name}</span>
                          <Badge className={template.difficulty === 'Easy' ? 'bg-secondary/20 text-secondary' : 'bg-accent/20 text-accent'}>
                            {template.difficulty}
                          </Badge>
                        </div>
                        <p className="text-xs text-white/50">{template.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            {/* History Button */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
              <DialogTrigger asChild>
                <Button data-testid="history-btn" variant="outline" size="sm" className="h-8 text-xs border-white/10 hover:border-primary/50">
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-surface border-white/10 max-w-xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="font-secondary">Session History</DialogTitle>
                </DialogHeader>
                {savedSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/50">No saved sessions yet</p>
                    <p className="text-xs text-white/30 mt-2">Click "Save" to save your current session</p>
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    {savedSessions.map((entry) => (
                      <Card key={entry.id} className="bg-black/40 border-white/10">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white/50">
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                            <Badge className="bg-white/10 text-white/70">{entry.language}</Badge>
                          </div>
                          <p className="text-xs text-white/70 font-mono line-clamp-2 mb-3">{entry.code.slice(0, 100)}...</p>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => loadFromHistory(entry)} className="h-7 text-xs flex-1">
                              <Eye className="w-3 h-3 mr-1" /> Load
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => deleteFromHistory(entry.id)} className="h-7 text-xs text-destructive">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Export Button */}
            <Button data-testid="export-btn" variant="outline" size="sm" onClick={exportTranscript} className="h-8 text-xs border-white/10 hover:border-secondary/50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            {/* Save Button */}
            <Button data-testid="save-btn" variant="outline" size="sm" onClick={saveToHistory} className="h-8 text-xs border-white/10">
              <FileText className="w-4 h-4 mr-2" />
              Save
            </Button>

            {/* AI Model Selector */}
            <Select value={aiModel} onValueChange={setAiModel}>
              <SelectTrigger data-testid="ai-model-select" className="w-[130px] h-8 text-xs bg-surface border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface border-white/10">
                <SelectItem value="gpt-5.2">GPT-5.2</SelectItem>
                <SelectItem value="claude-sonnet-4.5">Claude 4.5</SelectItem>
                <SelectItem value="gemini-3-flash">Gemini 3</SelectItem>
              </SelectContent>
            </Select>

            {/* Stealth Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-sm border border-white/10">
              <Shield className="w-4 h-4 text-accent" />
              <Label htmlFor="stealth-code" className="text-xs cursor-pointer">Stealth</Label>
              <Switch id="stealth-code" checked={stealthMode} onCheckedChange={setStealthMode} className="data-[state=checked]:bg-accent" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-120px)]">
          {/* Code Editor Panel */}
          <ResizablePanel defaultSize={55} minSize={30}>
            <Card className="h-full bg-surface border-white/10 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <FileCode className="w-4 h-4 text-accent" />
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger data-testid="language-select" className="w-[130px] h-7 text-xs bg-black/40 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-white/10">
                      {languageOptions.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button data-testid="copy-code-btn" variant="ghost" size="sm" onClick={copyCode} className="h-7 px-2 text-xs">
                    {copied ? <Check className="w-3 h-3 mr-1 text-secondary" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button data-testid="clear-code-btn" variant="ghost" size="sm" onClick={clearCode} className="h-7 px-2 text-xs text-destructive hover:text-destructive">
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
              <CardContent className="flex-1 p-0">
                <Textarea
                  data-testid="code-editor"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-full w-full resize-none code-editor border-0 rounded-none focus-visible:ring-0 p-4"
                  placeholder="Paste your code here..."
                  spellCheck={false}
                />
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle className="w-2 bg-transparent hover:bg-primary/20 transition-colors" />

          {/* AI Assistant Panel */}
          <ResizablePanel defaultSize={45} minSize={30}>
            <Card className="h-full bg-surface border-white/10 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="font-secondary font-bold text-xs tracking-wide uppercase">
                    AI ASSISTANT
                  </span>
                </div>
                {explanation && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button data-testid="speak-answer-btn" variant="ghost" size="sm" onClick={() => {
                          if (isSpeaking) stop(); else speak(explanation, 'answer');
                        }} className={`h-7 px-2 ${isSpeaking ? 'text-primary' : 'text-white/50'}`}>
                          {isSpeaking ? <Square className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isSpeaking ? 'Stop' : 'Read aloud'}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
                {/* Chat History */}
                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-4 pr-4">
                    {chatHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <Code className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40 text-sm font-primary">
                          Paste your code and ask for help!
                        </p>
                        <p className="text-white/30 text-xs mt-2">
                          I can explain algorithms, optimize code, or help debug issues.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)} className="mt-4 text-xs">
                          <BookOpen className="w-3 h-3 mr-2" />
                          Load Assessment Template
                        </Button>
                      </div>
                    ) : (
                      chatHistory.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 rounded-sm ${
                            msg.type === "user"
                              ? "bg-primary/10 border border-primary/20 ml-8"
                              : "bg-black/40 border border-white/5 mr-8"
                          }`}
                        >
                          <p className="text-xs font-bold uppercase tracking-wide text-white/50 mb-2">
                            {msg.type === "user" ? "YOU" : "AI"}
                          </p>
                          <div className="answer-content text-sm whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        </motion.div>
                      ))
                    )}

                    {isGenerating && (
                      <div className="p-3 rounded-sm bg-black/40 border border-white/5 mr-8">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Question Input */}
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      data-testid="question-input"
                      placeholder="Ask about your code..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="h-10 bg-black/40 border-white/10 focus:border-primary/50 font-primary text-sm pr-24"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          chatHistory.length > 0 ? askFollowUp() : analyzeCode();
                        }
                      }}
                    />
                    <Button
                      data-testid="send-question-btn"
                      size="sm"
                      onClick={chatHistory.length > 0 ? askFollowUp : analyzeCode}
                      disabled={isGenerating}
                      className="absolute right-1.5 top-1.5 h-7 bg-primary hover:bg-primary/90"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      data-testid="analyze-code-btn"
                      variant="outline"
                      size="sm"
                      onClick={analyzeCode}
                      disabled={isGenerating || !code.trim()}
                      className="flex-1 h-8 text-xs border-white/10 hover:border-primary/50"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Analyze Code
                    </Button>
                    <Button
                      data-testid="explain-btn"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuestion("Explain the time and space complexity");
                        analyzeCode();
                      }}
                      disabled={isGenerating || !code.trim()}
                      className="h-8 text-xs border-white/10 hover:border-accent/50"
                    >
                      Complexity
                    </Button>
                    <Button
                      data-testid="optimize-btn"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuestion("How can I optimize this code?");
                        analyzeCode();
                      }}
                      disabled={isGenerating || !code.trim()}
                      className="h-8 text-xs border-white/10 hover:border-secondary/50"
                    >
                      Optimize
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
};

export default CodeInterview;
