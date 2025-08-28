export const saveProject = (nodes, connections) => {
    const data = JSON.stringify({ nodes, connections });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mindtales.json';
    link.click();
  };
  
  export const loadProject = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(JSON.parse(e.target.result));
      };
      reader.readAsText(file);
    });
  };