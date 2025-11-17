import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Landing page with product value proposition
 */
router.get('/', (req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Semantic Foundry for AI-Native Identity Marketing Graphs</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #ccccd0ff;
      min-height: 100vh;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 1100px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 60px 50px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      background: #34c759;
      color: white;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 30px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    h1 {
      font-size: 2.75rem;
      font-weight: 700;
      margin-bottom: 20px;
      color: #1d1d1f;
      line-height: 1.1;
    }
    
    .tagline {
      font-size: 1.35rem;
      color: #86868b;
      margin-bottom: 20px;
      font-weight: 400;
      line-height: 1.4;
    }
    
    .subtext {
      font-size: 1.05rem;
      color: #6e6e73;
      margin-bottom: 50px;
      line-height: 1.5;
      max-width: 700px;
    }
    
    .value-props {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 40px;
      margin: 60px 0;
      padding-top: 40px;
      border-top: 1px solid #d2d2d7;
    }
    
    .value-prop {
      text-align: left;
    }
    
    .value-prop h2 {
      font-size: 1.4rem;
      margin-bottom: 12px;
      color: #1d1d1f;
      font-weight: 600;
    }
    
    .value-prop p {
      font-size: 1rem;
      color: #6e6e73;
      line-height: 1.6;
    }
    
    .features {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin: 50px 0;
      padding: 40px 0;
      border-top: 1px solid #d2d2d7;
      border-bottom: 1px solid #d2d2d7;
    }
    
    .feature {
      text-align: left;
    }
    
    .feature h3 {
      font-size: 1.1rem;
      margin-bottom: 8px;
      color: #1d1d1f;
      font-weight: 600;
    }
    
    .feature p {
      font-size: 0.95rem;
      color: #6e6e73;
      line-height: 1.5;
    }
    
    .cta-container {
      margin-top: 50px;
      display: flex;
      gap: 20px;
      align-items: center;
      justify-content: center;
    }
    
    .cta-button {
      display: inline-block;
      padding: 14px 32px;
      font-size: 1rem;
      font-weight: 600;
      color: white;
      background: #0071e3;
      border: none;
      border-radius: 8px;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .cta-button:hover {
      background: #0077ed;
    }
    
    .secondary-button {
      display: inline-block;
      padding: 14px 32px;
      font-size: 1rem;
      font-weight: 600;
      color: #0071e3;
      background: transparent;
      border: 2px solid #0071e3;
      border-radius: 8px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .secondary-button:hover {
      background: #0071e3;
      color: white;
    }
    
    .footer-links {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #d2d2d7;
      text-align: center;
    }
    
    .footer-link {
      display: inline-block;
      margin: 0 15px;
      color: #0071e3;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.2s;
    }
    
    .footer-link:hover {
      color: #0077ed;
      text-decoration: underline;
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 40px 30px;
      }
      
      h1 {
        font-size: 2rem;
      }
      
      .tagline {
        font-size: 1.15rem;
      }
      
      .value-props,
      .features {
        grid-template-columns: 1fr;
        gap: 30px;
      }
      
      .cta-container {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="status-badge">✓ API Online</div>
    
    <h1>Semantic Foundry for AI-Native Identity Marketing Graphs</h1>
    
    <p class="tagline">
      Semantic intelligence layers that make AI agents understand marketing, not just databases
    </p>
    
    <p class="subtext">
      Without semantic context, AI agents hallucinate marketing strategy. Our schemas teach them how audiences work—turning any LLM into a strategic marketing partner.
    </p>
    
    <div class="value-props">
      <div class="value-prop">
        <h2>Marketing Intelligence SDK</h2>
        <p>
          Semantic schemas that encode decades of targeting wisdom. Use them to build chatbots, recommendation engines, or any LLM that needs to think strategically about consumer data.
        </p>
      </div>
      
      <div class="value-prop">
        <h2>Instant Query Creation</h2>
        <p>
          Natural language to production-ready SQL in milliseconds. Built-in validation, live preview, and semantic guardrails ensure queries that actually work.
        </p>
      </div>
    </div>
    
    <div class="features">
      <div class="feature">
        <h3>Semantic Context</h3>
        <p>AI-optimized schemas with marketing meaning, creative potential, and strategic combinations encoded</p>
      </div>
      
      <div class="feature">
        <h3>Snowflake Validation</h3>
        <p>Real-time EXPLAIN integration catches errors before execution</p>
      </div>
      
      <div class="feature">
        <h3>Live Data Preview</h3>
        <p>Execute queries and inspect sample results before deployment</p>
      </div>
      
      <div class="feature">
        <h3>Claude Sonnet 4.5</h3>
        <p>Powered by Anthropic's latest model for nuanced audience understanding</p>
      </div>
    </div>
    
    <div class="cta-container">
      <a href="/api-docs" class="cta-button">
        API Documentation
      </a>
    </div>
    
    <div class="footer-links">
      <a href="/v1/health" class="footer-link">Health Status</a>
    </div>
  </div>
</body>
</html>
  `);
});

export { router as landingRouter };