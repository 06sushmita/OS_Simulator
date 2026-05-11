# OS Simulator

An interactive React + Vite simulator for exploring deadlock detection, safety checks, recovery strategies, and step-by-step execution.

## Features

- Configure processes, priorities, and resource pools
- Edit Allocation, Max, Need, and Available state visually
- Run Banker's Algorithm to verify safe or unsafe states
- Walk through the safe sequence with animated playback
- Recover from unsafe states by terminating processes or preempting the lowest-priority victim
- Inspect the system through a live resource-allocation graph and event log
- Save each user's safety-check inputs as scenario history and compare the current run against earlier inputs

## Stack

- React 19
- Vite 8
- Tailwind CSS 4
- Framer Motion
- Firebase
- Zustand

## Run locally

```bash
npm install
npm run dev
```

## Firebase auth setup

Enable these sign-in providers in the Firebase console for the `deadlock-simulator` project:

- Email/Password
- Google
- Firestore Database access for the `users/{uid}/scenarioHistory` collection

## Build

```bash
npm run build
```

## Project structure

```text
src/
  algorithms/   Core Banker's Algorithm logic
  components/   Shared UI and step-specific views
  store/        Zustand simulation state and actions
```
