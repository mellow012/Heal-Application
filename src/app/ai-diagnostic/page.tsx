'use client';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Loader2, BarChart2, Send, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvide';
import { useRouter } from 'next/navigation';

// Mock AI decision tree (simulates Infermedica)
const diagnosticTree = {
  start: {
    question: 'What is your main symptom?',
    options: ['Fever', 'Cough', 'Headache', 'None'],
    next: {
      Fever: 'fever',
      Cough: 'cough',
      Headache: 'headache',
      None: 'end'
    }
  },
  fever: {
    question: 'Do you have a cough along with the fever?',
    options: ['Yes', 'No'],
    next: {
      Yes: 'fever_cough',
      No: 'fever_no_cough'
    }
  },
  fever_cough: {
    question: 'Do you have difficulty breathing?',
    options: ['Yes', 'No'],
    next: {
      Yes: 'end',
      No: 'end'
    },
    result: {
      Yes: { condition: 'Possible Pneumonia', advice: 'Seek a doctor immediately' },
      No: { condition: 'Possible Flu', advice: 'Rest and consult a doctor if symptoms persist' }
    }
  },
  fever_no_cough: {
    question: 'Do you have body aches?',
    options: ['Yes', 'No'],
    next: {
      Yes: 'end',
      No: 'end'
    },
    result: {
      Yes: { condition: 'Possible Malaria', advice: 'Visit a clinic for a malaria test' },
      No: { condition: 'Possible Viral Fever', advice: 'Rest and stay hydrated' }
    }
  },
  cough: {
    question: 'Is your cough dry or productive (with phlegm)?',
    options: ['Dry', 'Productive'],
    next: {
      Dry: 'end',
      Productive: 'end'
    },
    result: {
      Dry: { condition: 'Possible Allergies or Cold', advice: 'Use antihistamines or consult a doctor' },
      Productive: { condition: 'Possible Bronchitis', advice: 'See a doctor for evaluation' }
    }
  },
  headache: {
    question: 'Do you have a fever with the headache?',
    options: ['Yes', 'No'],
    next: {
      Yes: 'end',
      No: 'end'
    },
    result: {
      Yes: { condition: 'Possible Meningitis', advice: 'Seek emergency care' },
      No: { condition: 'Possible Tension Headache', advice: 'Rest and consider pain relief' }
    }
  },
  end: {}
};

export default function AIDiagnostic() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [diagnoses, setDiagnoses] = useState([]);
  const [currentNode, setCurrentNode] = useState('start');
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');

  // Fetch past diagnoses
  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    const userId = user.uid;
    const q = query(collection(db, `e-passports/${userId}/diagnoses`), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDiagnoses(data);
      setLoading(false);
    }, (error) => {
      console.error('AIDiagnostic: Error fetching diagnoses:', error.message);
      alert(`Failed to load diagnoses: ${error.message}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  // Handle user input
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !diagnosticTree[currentNode].options.includes(input)) {
      alert('Please select a valid option');
      return;
    }

    const newAnswers = [...answers, { question: diagnosticTree[currentNode].question, answer: input }];
    setAnswers(newAnswers);

    const nextNode = diagnosticTree[currentNode].next[input];
    setCurrentNode(nextNode);

    if (diagnosticTree[nextNode]?.result?.[input]) {
      const diagnosis = diagnosticTree[nextNode].result[input];
      setResult(diagnosis);

      // Save to Firestore
      try {
        await addDoc(collection(db, `e-passports/${user.uid}/diagnoses`), {
          userId: user.uid,
          symptoms: newAnswers,
          condition: diagnosis.condition,
          advice: diagnosis.advice,
          createdAt: new Date()
        });
      } catch (error) {
        console.error('AIDiagnostic: Error saving diagnosis:', error.message);
        alert('Failed to save diagnosis');
      }
    }

    setInput('');
  };

  const restart = () => {
    setCurrentNode('start');
    setAnswers([]);
    setResult(null);
  };

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Please Sign In</h1>
        <Link href="/sign-in" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
          Sign In
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <BarChart2 className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800">AI Diagnostic</h1>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Symptom Checker</h2>
          <div className="space-y-4">
            {answers.map((ans, idx) => (
              <div key={idx} className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-slate-600">{ans.question}</p>
                <p className="font-medium text-slate-800">{ans.answer}</p>
              </div>
            ))}
            {result ? (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-medium text-slate-800">Possible Condition: {result.condition}</p>
                <p className="text-sm text-slate-600">Advice: {result.advice}</p>
                <button
                  onClick={restart}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Start Over
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-lg font-medium text-slate-800">{diagnosticTree[currentNode].question}</p>
                <div className="flex flex-wrap gap-2">
                  {diagnosticTree[currentNode].options?.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setInput(option)}
                      className={`px-4 py-2 rounded-lg border ${input === option ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border-slate-300 hover:bg-blue-50'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  disabled={!input}
                >
                  <Send className="h-5 w-5" />
                  Submit
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Past Diagnoses</h2>
          {diagnoses.length > 0 ? (
            <ul className="space-y-4">
              {diagnoses.map(diagnosis => (
                <li key={diagnosis.id} className="p-4 bg-blue-50 rounded-lg">
                  <p className="font-medium text-slate-800">{diagnosis.condition}</p>
                  <p className="text-sm text-slate-600">Advice: {diagnosis.advice}</p>
                  <p className="text-sm text-slate-600">Date: {new Date(diagnosis.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-slate-600">Symptoms:</p>
                  <ul className="list-disc pl-5 text-sm text-slate-600">
                    {diagnosis.symptoms.map((sym, idx) => (
                      <li key={idx}>{sym.question}: {sym.answer}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600 text-center py-4">No past diagnoses</p>
          )}
        </div>
      </div>
    </div>
  );
}