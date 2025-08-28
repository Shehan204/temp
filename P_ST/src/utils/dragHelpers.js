export const getNodePosition = (event, element) => {
    const rect = element.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };
  
  export const validateConnection = (nodes, connection) => {
    return nodes.some(n => n.id === connection.from) && 
           nodes.some(n => n.id === connection.to);
  };
  
  export const constrainPosition = (pos, bounds) => {
    return {
      x: Math.max(bounds.minX, Math.min(pos.x, bounds.maxX)),
      y: Math.max(bounds.minY, Math.min(pos.y, bounds.maxY))
    };
  };