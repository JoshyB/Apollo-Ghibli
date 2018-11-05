const { ApolloServer, gql } = require("apollo-server");
const fetch = require("node-fetch");

// This is a (sample) collection of books we'll be able to query
// the GraphQL server for.  A more complete example might fetch
// from an existing data source like a REST API or database.
const baseURL = `https://ghibliapi.herokuapp.com`;

// Type definitions define the "shape" of your data and specify
// which ways the data can be fetched from the GraphQL server.
const typeDefs = gql`
  # Comments in GraphQL are defined with the hash (#) symbol.

  # The "Query" type is the root of all GraphQL queries.
  # (A "Mutation" type will be covered later on.)
  type Query {
    hello(name: String): String!
    Film: [Film]
    People: [People]
    Locations: [Locations]
    Species: [Species]
    Vehicles: [Vehicles]
    # ⚠️  I am using "id: String!" as a parameter for the getFIlm, getPerson etc. as GraphQL does not support Int64(which is what the Studio Ghibli API uses) as far as I can tell and will throw and error if you try to pass it as an Int, so be sure to pass your query as a string in your client to get results back  ⚠️
    getFilm(id: String!): Film
    getPerson(id: String!): People
    getLocation(id: String!): Locations
    getSpecies(id: String!): Species
    getVehicle(id: String!): Vehicles
  }
  type Film {
    id: ID
    title: String
    description: String
    director: String
    producer: String
    release_date: String
    rt_score: String
    people: [People]
    species: [Species]
    locations: [String]
    vehicles: [String]
    url: String
  }
  type People {
    id: ID
    name: String
    gender: String
    age: String
    eye_color: String
    hair_color: String
    films: [Film]
    species: Species
    url: String
    length: String
  }
  type Locations {
    id: ID
    name: String
    climate: String
    terrain: Int
    surface_water: String
    residents: [People]
    films: [Film]
    url: String
  }
  type Species {
    id: ID
    name: String
    classification: String
    eye_colors: String
    hair_colors: String
    people: [People]
    films: [Film]
    url: String
  }
  type Vehicles {
    id: ID
    name: String
    description: String
    vehicle_class: String
    length: String
    pilot: People
    films: String
    url: String
  }
`;

// resolves the nested Film data types and can be used within any of the other types that need Films resolved inside of them
const filmResolver = parent => {
  const promises = parent.films.map(async url => {
    const response = await fetch(url);
    return response.json();
  });
  return Promise.all(promises);
};

// resolves nested people data types
const peopleResolver = parent => {
  const promises = parent.people.map(async url => {
    const response = await fetch(url);
    return response.json();
  });
  return Promise.all(promises);
};

const speciesResolver = parent => {
  const promises = parent.species.map(async url => {
    const response = await fetch(url);
    return response.json();
  });
  return Promise.all(promises);
};

// Resolvers define the technique for fetching the types in the
// schema.  We'll retrieve books from the "books" array above.
const resolvers = {
  Film: {
    people: peopleResolver,
    species: speciesResolver
  },
  People: {
    films: filmResolver,
    species: parent => {
      return fetch(parent.species).then(response => response.json());
    }
  },
  Locations: {
    films: filmResolver,
    residents: peopleResolver
  },
  Species: {
    films: filmResolver,
    people: peopleResolver
  },
  Vehicles: {
    pilot: parent => {
      return fetch(parent.pilot).then(response => response.json());
    }
  },
  Query: {
    Film: () => {
      return fetch(`${baseURL}/films`).then(response => response.json());
    },
    People: () => {
      return fetch(`${baseURL}/people`).then(response => response.json());
    },
    Locations: () => {
      return fetch(`${baseURL}/locations`).then(response => response.json());
    },
    Species: () => {
      return fetch(`${baseURL}/species`).then(response => response.json());
    },
    Vehicles: () => {
      return fetch(`${baseURL}/vehicles`).then(response => response.json());
    },
    // The following five(5) queries hit the API endpoints which give you data for individual items in the database
    getPerson: (_, { id }) => {
      return fetch(`${baseURL}/people/${id}`).then(response => response.json());
    },
    getFilm: (_, { id }) => {
      return fetch(`${baseURL}/films/${id}`).then(response => response.json());
    },
    getLocation: (_, { id }) => {
      return fetch(`${baseURL}/locations/${id}`).then(response =>
        response.json()
      );
    },
    getSpecies: (_, { id }) => {
      return fetch(`${baseURL}/species/${id}`).then(response =>
        response.json()
      );
    },
    getVehicle: (_, { id }) => {
      return fetch(`${baseURL}/vehicles/${id}`).then(response =>
        response.json()
      );
    }
  }
};

// In the most basic sense, the ApolloServer can be started
// by passing type definitions (typeDefs) and the resolvers
// responsible for fetching the data for those types.
const server = new ApolloServer({ typeDefs, resolvers });

// This `listen` method launches a web-server.  Existing apps
// can utilize middleware options, which we'll discuss later.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
