import React, { useState, useEffect } from 'react';
import useStore from '../../stores/useStore';
import Button from '../Shared/Button';
import { saveProject, loadProject } from '../../utils/fileHandlers';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import './Toolbar.css';

// Initialize Firestore
const db = getFirestore();

export default function Toolbar() {
  const { nodes, connections, placingNodeType } = useStore();
  const hasHomeNode = nodes.some(node => node.type === 'Home');
  
  // State variables
  const [uploadStatus, setUploadStatus] = useState({ visible: false, progress: 0, message: '' });
  const [showFirebaseLoad, setShowFirebaseLoad] = useState(false);
  const [firebaseProjects, setFirebaseProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // New state for AI Story modal
  const [storyModal, setStoryModal] = useState({ visible: false, story: '', loading: false });

  // Predefined prompts
  const storyPrompts = [
    `Write an educational story (3-5 paragraphs) targeted at young children using simple words. The story should be inspired from this text snippet:
“What's the best way to prepare for a job interview in the healthcare industry?
I don't have personal experiences, but here are some tips to prepare for a job interview in the healthcare industry:

1. do your research: learn about the company and its mission statement. familiarize yourself with the job requirements and responsibilities.

2. review your resume: make sure you are able to explain all listed job experiences, skills, and qualifications in detail.

3. understand industry trends: know the current trends and latest developments in the healthcare industry, including any changes in rules and regulations.

4. practice common interview questions: prepare answers to common healthcare industry questions, including those about patient care and health care policies.

5. dress appropriately: wear professional attire that is suitable for the job interview.

6. arrive on time: plan to arrive at least 15 minutes early to avoid being late.

7. bring necessary documents: bring copies of your”

The story doesn’t have to be addressing everything in the snippet, it is there just for inspiration.
The story should have the following features:
- Science integration: embed basic science concepts within the story, explaining them through the characters' adventures and discoveries.
- Characters and dialogue: create memorable characters who engage in meaningful conversations, helping to explain and explore the science concepts.
- Unexpected twist: conclude with a twist that doesn't resolve as hoped, but leaves a clear lesson about life and science.`,
`Write an educational story (3-5 paragraphs) targeted at young children using simple words. The story should be inspired from this text snippet:
“How does a Majority Leader prioritize their policy goals when working with members of their party and those across the aisle, and how do they determine which goals to focus on first?
As an AI language model, I don't have personal beliefs or experiences, but I can provide general information on how a Majority Leader may prioritize policy goals while working with members of their party and those across the aisle. Here are some steps that a Majority Leader may follow:

1. Identify the key policy areas and issues that need to be addressed - Majority Leaders typically have an idea about the priority areas that need attention. They may consider the challenges facing their party, their constituents, or the nation as a whole.

2. Assess the level of support for each policy goal - Majority Leaders need to gauge which policy goals have broad support among their party members as well as across the aisle. They may use informal discussions, polling, and other tools to determine the level of support”

The story doesn’t have to be addressing everything in the snippet, it is there just for inspiration.
The story should have the following features:
- Science integration: embed basic science concepts within the story, explaining them through the characters' adventures and discoveries.
- Characters and dialogue: create memorable characters who engage in meaningful conversations, helping to explain and explore the science concepts.
- Unexpected twist: conclude with a twist that doesn't resolve as hoped, but leaves a clear lesson about life and science.`,
`Write an educational story (3-5 paragraphs) targeted at young children using simple words. The story should be inspired from this text snippet:
“What led Tina Turner to transition from music to acting and how successful was she in this transition?
Tina Turner transitioned from music to acting after the success of her autobiographical book, "I, Tina," which was later turned into a movie called "What's Love Got to Do with It." The movie was a biopic on Turner's life, and she played herself in some scenes.

Turner's performance in the movie was critically acclaimed, and she received numerous accolades, including a Golden Globe for Best Actress in a Motion Picture – Comedy or Musical. This success encouraged her to pursue more acting roles, and she went on to appear in films such as "Last Action Hero," "Supernova," and "Between Two Worlds." However, she never achieved the same level of success in acting as she did in music.

In conclusion, Tina Turner transitioned to acting after the success of her autobiographical book which resulted in her playing herself in a biopic, but she never achieved the same level of success in acting a”

The story doesn’t have to be addressing everything in the snippet, it is there just for inspiration.
The story should have the following features:
- Science integration: embed basic science concepts within the story, explaining them through the characters' adventures and discoveries.
- Characters and dialogue: create memorable characters who engage in meaningful conversations, helping to explain and explore the science concepts.
- Unexpected twist: conclude with a twist that doesn't resolve as hoped, but leaves a clear lesson about life and science.`,

    `Write an educational story (3-5 paragraphs) targeted at young children using simple words. The story should be inspired from this text snippet:
“I happened to catch this film at a screening in Brooklyn - it's difficult to describe the plot; it has a lot of wacky characters, but let's just say I'd have a hard time choosing which one made me laugh the hardest, I wouldn't know where to begin. Even the peripheral roles are well written and well acted.

There are numerous small touches that make it unique and very enjoyable, it has a few "devices" that pop up and add another hilarious layer. It is refreshing to watch; not some recycled stuff I'd seen many times before. If this film could reach a wider audience, I'm certain it would be a real crowd-pleaser, the story is so original and heartfelt.

There's a lot here to like, funny back-stories, mishaps and misunderstandings which set up the final act and dramatic conclusion. Cross Eyed is a very funny movie with a ton of heart; it's a touching story with fast paced comedy woven throughout. Definitely worth seeing!

Is the sentiment of this review positive or negative?
The sentiment o”

The story doesn’t have to be addressing everything in the snippet, it is there just for inspiration.
The story should have the following features:
- Science integration: embed basic science concepts within the story, explaining them through the characters' adventures and discoveries. For example, if the story includes a scene where characters are looking at the sky, you could have them wonder why it's blue and explain the physics behind in grade school level.
- Dialogue: include at least one dialogue and insightful conversation.
- Unexpected twist: conclude with a twist that doesn't resolve as hoped, but leaves a clear lesson about life and science.
Do not start with classic sentences like "Once upon a time", be creative.`
  ];

  const handleAddNode = (type) => {
    if (type === 'Home' && hasHomeNode) return;
    if (placingNodeType === type) {
      useStore.getState().cancelPlacement();
    } else {
      useStore.getState().setPlacingNodeType(type);
    }
  };

  const handleSave = () => {
    saveProject(nodes, connections);
  };

  const handleLoad = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const data = await loadProject(file);
      useStore.setState({
        nodes: data.nodes || [],
        connections: data.connections || [],
        placingNodeType: null,
        previewPosition: null
      });
    }
  };

  const handleUploadToFirebase = async () => {
    try {
      const homeNode = nodes.find(n => n.type === 'Home');
      if (!homeNode) {
        alert('Please create a Home node before uploading');
        return;
      }

      setUploadStatus({ visible: true, progress: 0, message: 'Preparing upload...' });
      
      // Sanitize project name
      const projectName = homeNode.title
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .substring(0, 50);

      const projectRef = doc(db, 'projects', projectName);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadStatus(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      await setDoc(projectRef, {
        nodes,
        connections,
        createdAt: new Date().toISOString(),
        projectName: homeNode.title
      });

      clearInterval(progressInterval);
      setUploadStatus({ visible: true, progress: 100, message: 'Upload complete!' });
      setTimeout(() => setUploadStatus({ ...uploadStatus, visible: false }), 2000);
    } catch (error) {
      console.error('Error uploading project: ', error);
      setUploadStatus({ visible: true, progress: 0, message: `Error: ${error.message}` });
      setTimeout(() => setUploadStatus({ ...uploadStatus, visible: false }), 3000);
    }
  };

  const loadFirebaseProject = async (projectId) => {
    try {
      const docRef = doc(db, 'projects', projectId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        useStore.setState({
          nodes: data.nodes || [],
          connections: data.connections || [],
          placingNodeType: null,
          previewPosition: null
        });
        setShowFirebaseLoad(false);
        alert(`Successfully loaded project: ${data.projectName}`);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      alert('Error loading project from Firebase');
    }
  };

  const fetchFirebaseProjects = async () => {
    try {
      setLoadingProjects(true);
      const querySnapshot = await getDocs(collection(db, 'projects'));
      const projects = [];
      querySnapshot.forEach((doc) => {
        projects.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setFirebaseProjects(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (showFirebaseLoad) {
      fetchFirebaseProjects();
    }
  }, [showFirebaseLoad]);

  const getButtonStatus = (type) => {
    return placingNodeType === type ? 'placing' : '';
  };

  // Function to fetch AI story
  const fetchStory = async () => {
    try {
      setStoryModal({ visible: true, story: '', loading: true });

      // Pick random prompt
      const prompt = storyPrompts[Math.floor(Math.random() * storyPrompts.length)];

      const response = await fetch('http://localhost:3000/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();

      if (response.ok) {
        setStoryModal({ visible: true, story: data.story, loading: false });
      } else {
        setStoryModal({ visible: true, story: `Error: ${data.error}`, loading: false });
      }
    } catch (error) {
      setStoryModal({ visible: true, story: 'Failed to connect to AI service.', loading: false });
    }
  };

  return (
    <div className="toolbar-container">
      <div className="toolbar">
        {/* Node Creation Buttons */}
        <Button 
          className={`toolbar-btn scene-btn ${getButtonStatus('Scene')}`}
          onClick={() => handleAddNode('Scene')}
          aria-label="Add new scene node"
        >
          <span className="button-icon">✨</span>
          <span className="button-text">Add Scene</span>
        </Button>

        <Button 
          className={`toolbar-btn good-ending-btn ${getButtonStatus('GoodEnding')}`}
          onClick={() => handleAddNode('GoodEnding')}
          aria-label="Add new good ending node"
        >
          <span className="button-icon">✅</span>
          <span className="button-text">Good Ending</span>
        </Button>

        <Button 
          className={`toolbar-btn bad-ending-btn ${getButtonStatus('BadEnding')}`}
          onClick={() => handleAddNode('BadEnding')}
          aria-label="Add new bad ending node"
        >
          <span className="button-icon">❌</span>
          <span className="button-text">Bad Ending</span>
        </Button>

        <Button 
          className={`toolbar-btn home-btn ${getButtonStatus('Home')}`}
          onClick={() => handleAddNode('Home')}
          aria-label="Add home node"
          disabled={hasHomeNode}
        >
          <span className="button-icon">🏠</span>
          <span className="button-text">Home</span>
        </Button>

        {/* Project Management Buttons */}
        <div className="toolbar-divider" />

        <Button 
          className="toolbar-btn save-btn"
          onClick={handleSave}
          aria-label="Save project"
        >
          <span className="button-icon">💾</span>
          <span className="button-text">Save Project</span>
        </Button>

        <Button 
          className="toolbar-btn load-btn"
          onClick={() => document.getElementById('load-input').click()}
          aria-label="Load project"
        >
          <span className="button-icon">📂</span>
          <span className="button-text">Load Project</span>
          <input
            id="load-input"
            type="file"
            accept=".json"
            hidden
            onChange={handleLoad}
          />
        </Button>

        <Button 
          className="toolbar-btn firebase-btn"
          onClick={handleUploadToFirebase}
          aria-label="Upload to Firebase"
        >
          <span className="button-icon">🔥</span>
          <span className="button-text">Upload to Cloud</span>
        </Button>

        <Button 
          className="toolbar-btn firebase-load-btn"
          onClick={fetchStory}
          aria-label="Generate story with AI"
        >
          <span className="button-icon">🤖</span>
          <span className="button-text">Out Of Ideas?</span>
        </Button>

        {/* Placement Status Indicator */}
        {placingNodeType && (
          <div className="placement-status">
            Placing: {placingNodeType} Node
            <br />
            <small>(Click anywhere to place or press ESC to cancel)</small>
          </div>
        )}

        {/* Upload Status Bar */}
        {uploadStatus.visible && (
          <div className="upload-status-bar">
            <div className="upload-progress" style={{ width: `${uploadStatus.progress}%` }} />
            <div className="upload-message">{uploadStatus.message}</div>
          </div>
        )}

        {/* Story Modal */}
        {storyModal.visible && (
          <div className="firebase-load-modal">
            <div className="modal-content">
              <h3>AI Generated Story</h3>
              <button className="close-modal" onClick={() => setStoryModal({ ...storyModal, visible: false })}>×</button>

              {storyModal.loading ? (
                <div className="loading-projects">
                  <div className="loading-spinner"></div>
                  Generating story...
                </div>
              ) : (
                <>
                  <div className="story-output">{storyModal.story}</div>
                  <button className="retry-btn" onClick={fetchStory}>🔄 Retry</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Firebase Load Modal remains if needed */}
        {showFirebaseLoad && (
          <div className="firebase-load-modal">
            <div className="modal-content">
              <h3>Cloud Saves</h3>
              <button className="close-modal" onClick={() => setShowFirebaseLoad(false)}>×</button>
              
              {loadingProjects ? (
                <div className="loading-projects">
                  <div className="loading-spinner"></div>
                  Loading cloud projects...
                </div>
              ) : (
                <div className="project-list">
                  {firebaseProjects.length > 0 ? (
                    firebaseProjects.map(project => (
                      <div 
                        key={project.id} 
                        className="project-item"
                        onClick={() => loadFirebaseProject(project.id)}
                      >
                        <div className="project-name">{project.projectName || 'Untitled Project'}</div>
                        <div className="project-meta">
                          <span className="project-id">ID: {project.id}</span>
                          <span className="project-date">
                            {new Date(project.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-projects">No projects found in cloud storage</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
