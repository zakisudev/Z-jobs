# Z-Jobs

Z-Jobs is a job listing application built with Node.js, Express, React, and MySQL (via Prisma). It allows users to browse job listings, apply for jobs, and manage their applications.

## Features

- User registration and authentication
- Job listing
- Job application
- Application management

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js
- Docker and Docker Compose (for local MySQL)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/zakisudev/Z-jobs.git
```

2. Install NPM packages:

```bash
cd Z-jobs
npm install
```

3. Create a `.env` file in the root directory (see `.env.example`):

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=YOUR_JWT_SECRET
DATABASE_URL="mysql://zjobs:zjobs@127.0.0.1:3307/z_jobs"
```

For production, set `NODE_ENV=production` and point `DATABASE_URL` at your production MySQL instance (for example `mysql://USER:PASSWORD@HOST:3306/z_jobs?connection_limit=10`).

4. Start the local MySQL database:

```bash
npm run db:up
```

5. Apply Prisma migrations and generate the client:

```bash
npm run prisma:migrate
```

6. Start the API (and optionally the React client):

```bash
npm start
# or for API + frontend together:
npm run dev
```

The API runs at `http://localhost:5000`. The React client (via `npm run client` or `npm run dev`) runs at `http://localhost:3000`.

### Useful scripts

| Script                    | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `npm run db:up`           | Start local MySQL (Docker Compose, host port **3307**) |
| `npm run db:down`         | Stop local MySQL                                       |
| `npm run prisma:migrate`  | Run Prisma migrations                                  |
| `npm run prisma:generate` | Generate Prisma Client                                 |
| `npm run prisma:studio`   | Open Prisma Studio                                     |

## Usage

After starting the server, you can register as a new user, browse jobs added, add jobs to your MyJobs section, edit your profile, and track your jobs easily.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Zekaria Hussien - [@zakisu](https://twitter.com/zakisu) - zakisudev@gmail.com

Project Link: [https://jobs.zakisu.tech/](https://jobs.zakisu.tech/)
