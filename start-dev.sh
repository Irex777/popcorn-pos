#!/bin/bash
export DATABASE_URL=postgresql://popcorn_user:popcorn123@localhost:5432/popcorn_pos?sslmode=disable
npm run dev