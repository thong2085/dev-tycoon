<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Google Gemini API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Google Gemini AI API integration
    |
    */

    'api_key' => env('GEMINI_API_KEY'),
    
    'api_url' => 'https://generativelanguage.googleapis.com/v1beta/models',
    
    'model' => env('GEMINI_MODEL', 'gemini-2.5-flash'),
    
    'temperature' => env('GEMINI_TEMPERATURE', 0.7),
    
    'max_tokens' => env('GEMINI_MAX_TOKENS', 2048),
];

