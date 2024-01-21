# Gmail Automation with Node.js

Automate your Gmail responses and labeling using Node.js and Google's Gmail API.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)


## Overview

This Node.js script utilizes the Gmail API to automate the process of replying to email threads and applying a label to those emails. It runs in the background and checks for new emails at random intervals.

## Features

1. Automatic replies to emails that have no prior replies.
2. Checks for new emails in a specified Gmail ID.
3. Adds a label to the email and moves it to the labeled category.
4. Runs in intervals of 45 seconds.

## Prerequisites

Before running the script, make sure you have the following prerequisites:

- Node.js
- npm
- Google Cloud Platform project with Gmail API enabled
- OAuth 2.0 client credentials (clientSecret.json)
- Gmail ID for automation

## Installation

1. Clone the repository.
2. Create a private folder in the root of the project.
3. Obtain the clientSecret.json file from the Google Cloud Platform and place it in the private folder.
4. Install dependencies:
    `npm install`

## Usage

1. Run the script
    `node ./src/server.js`
2. Follow the authorization steps prompted in the console.
3. The script will automatically reply to email threads and add a label.

## Configuration

Before running the script, you need to set up the following configurations:

- clientSecret.json: Obtain this file from the Google Cloud Platform and place it in the private folder.
- Label ID: Set the desired label id in the replyToEmail function.