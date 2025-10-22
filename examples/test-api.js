// Test script to demonstrate API usage
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  try {
    console.log('🚀 Testing Call Funnel Analyzer API...\n');

    // 1. Create a call script
    console.log('1. Creating call script...');
    const callScriptResponse = await axios.post(`${BASE_URL}/call-scripts`, {
      name: "Sales Call Script - Product Demo",
      description: "Standard script for product demonstration calls",
      introduction: {
        required: true,
        description: "Professional greeting and introduction phase",
        keyPoints: [
          "Greet the customer warmly",
          "Introduce yourself and company",
          "Confirm customer's availability",
          "Set expectations for the call duration"
        ]
      },
      pitch: {
        required: true,
        description: "Present the product/service value proposition",
        keyPoints: [
          "Explain the main product benefits",
          "Address customer pain points",
          "Provide specific examples or case studies",
          "Highlight unique selling points",
          "Ask for feedback and questions"
        ]
      },
      dataCollection: {
        required: true,
        description: "Gather essential customer information",
        keyPoints: [
          "Collect contact information (email, phone)",
          "Understand current business needs",
          "Assess budget and timeline",
          "Identify decision makers",
          "Document customer requirements"
        ]
      },
      closing: {
        required: true,
        description: "Professional call conclusion",
        keyPoints: [
          "Summarize key discussion points",
          "Confirm next steps and timeline",
          "Schedule follow-up meeting if needed",
          "Thank the customer for their time",
          "Provide contact information for questions"
        ]
      }
    });

    const callScriptId = callScriptResponse.data.data.id;
    console.log(`✅ Call script created with ID: ${callScriptId}\n`);

    // 2. Create a transcript
    console.log('2. Creating transcript...');
    const transcriptResponse = await axios.post(`${BASE_URL}/transcripts`, {
      content: `Agent: Hello, this is Sarah from TechSolutions. How are you doing today?

Customer: Hi Sarah, I'm doing well, thank you. How can I help you?

Agent: Great to hear! I'm calling to introduce you to our new cloud management platform that can help streamline your business operations. Do you have a few minutes to discuss this?

Customer: Sure, I have about 10 minutes. What's this about?

Agent: Perfect! Our platform helps businesses like yours reduce operational costs by up to 30% while improving efficiency. We've helped over 500 companies automate their workflows. For example, one of our clients, a manufacturing company, reduced their inventory management time by 50% using our system.

Customer: That sounds interesting. How does it work exactly?

Agent: The platform integrates with your existing systems and provides real-time analytics. It's designed to be user-friendly and requires minimal training. What type of business operations are you currently managing manually?

Customer: We handle a lot of inventory tracking and customer service requests manually. It's becoming quite time-consuming.

Agent: That's exactly what our platform addresses! We can automate both of those processes for you. What's your current team size for these operations?

Customer: We have about 15 people handling inventory and customer service.

Agent: Excellent! Our platform is perfect for teams of that size. What's your timeline for implementing new solutions?

Customer: We're looking to make improvements within the next quarter.

Agent: That's perfect timing. We can have you up and running within 4-6 weeks. Let me get your contact information so I can send you a detailed proposal. What's the best email address to reach you?

Customer: You can reach me at john.smith@company.com.

Agent: Perfect! I'll send you a comprehensive proposal by tomorrow. We can also schedule a demo call next week to show you the platform in action. Does Tuesday at 2 PM work for you?

Customer: Yes, that works for me.

Agent: Excellent! I'll send you a calendar invite. Is there anything else you'd like to know about our platform?

Customer: No, that covers it for now. Thank you for the information.

Agent: You're very welcome! I'll follow up with the proposal and demo details. Thank you for your time today, and I look forward to speaking with you again on Tuesday.

Customer: Sounds good. Have a great day!

Agent: You too! Goodbye.`,
      metadata: {
        duration: 300,
        participants: ["Agent", "Customer"],
        date: "2024-01-15"
      }
    });

    const transcriptId = transcriptResponse.data.data.id;
    console.log(`✅ Transcript created with ID: ${transcriptId}\n`);

    // 3. Analyze the call
    console.log('3. Analyzing call...');
    const analysisResponse = await axios.post(`${BASE_URL}/analysis/analyze`, {
      transcriptId: transcriptId,
      callScriptId: callScriptId
    });

    const analysisId = analysisResponse.data.data.id;
    console.log(`✅ Analysis completed with ID: ${analysisId}\n`);

    // 4. Get analysis results
    console.log('4. Retrieving analysis results...');
    const resultsResponse = await axios.get(`${BASE_URL}/analysis/${analysisId}`);
    const results = resultsResponse.data.data.result;

    console.log('📊 ANALYSIS RESULTS:');
    console.log(`Overall Score: ${results.overallScore}/10`);
    console.log(`Summary: ${results.summary}\n`);

    console.log('📋 POINT-BY-POINT ANALYSIS:');
    Object.entries(results.points).forEach(([point, data]) => {
      console.log(`\n${point.toUpperCase()}:`);
      console.log(`  Present: ${data.present ? '✅' : '❌'}`);
      console.log(`  Quality Score: ${data.qualityScore}/10`);
      console.log(`  Evidence: ${data.evidence}`);
      console.log(`  Suggestions: ${data.suggestions}`);
    });

    console.log('\n💡 RECOMMENDATIONS:');
    results.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });

    // 5. Get statistics
    console.log('\n5. Getting overall statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/analysis/stats/overview`);
    const stats = statsResponse.data.data;

    console.log('\n📈 STATISTICS:');
    console.log(`Total Analyses: ${stats.totalAnalyses}`);
    console.log(`Average Score: ${stats.averageScore}/10`);
    console.log('Point Coverage:');
    Object.entries(stats.pointCoverage).forEach(([point, coverage]) => {
      console.log(`  ${point}: ${coverage}%`);
    });

    console.log('\n🎉 API test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
  }
}

// Run the test
testAPI();
