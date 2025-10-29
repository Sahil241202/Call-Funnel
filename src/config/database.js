// Database configuration for future scalability
// Currently using in-memory storage, can be extended to MongoDB/PostgreSQL

class Database {
  constructor() {
    this.callScripts = new Map();
    this.transcripts = new Map();
    this.analyses = new Map();
    this.callStages = new Map();
  }

  // Call Script operations
  saveCallScript(id, script) {
    this.callScripts.set(id, {
      ...script,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  getCallScript(id) {
    return this.callScripts.get(id);
  }

  getAllCallScripts() {
    return Array.from(this.callScripts.entries()).map(([id, script]) => ({
      id,
      ...script
    }));
  }

  // Transcript operations
  saveTranscript(id, transcript) {
    this.transcripts.set(id, {
      ...transcript,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  getTranscript(id) {
    return this.transcripts.get(id);
  }

  // Analysis operations
  saveAnalysis(id, analysis) {
    this.analyses.set(id, {
      ...analysis,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  getAnalysis(id) {
    return this.analyses.get(id);
  }

  getAllAnalyses() {
    return Array.from(this.analyses.entries()).map(([id, analysis]) => ({
      id,
      ...analysis
    }));
  }

  // Call Stages operations
  saveCallStages(id, stages) {
    this.callStages.set(id, {
      ...stages,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  getCallStages(id) {
    return this.callStages.get(id);
  }

  getAllCallStages() {
    return Array.from(this.callStages.entries()).map(([id, stages]) => ({
      id,
      ...stages
    }));
  }
}

module.exports = new Database();
