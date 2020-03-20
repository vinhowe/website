extern crate js_sys;
extern crate web_sys;

use web_sys::console;

use js_sys::Math::random;

use wasm_bindgen::prelude::*;

pub struct Timer<'a> {
    name: &'a str,
}

impl<'a> Timer<'a> {
    pub fn new(name: &'a str) -> Timer<'a> {
        console::time_with_label(name);
        Timer { name }
    }
}

impl<'a> Drop for Timer<'a> {
    fn drop(&mut self) {
        console::time_end_with_label(self.name);
    }
}

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
    // alert("yes!");
}

pub fn rand_range_f32(low: f32, high: f32) -> f32 {
    return low + ((random() as f32) * (high - low) as f32);
}

pub fn rand_range_t_f32(tuple: (f32, f32)) -> f32 {
    return rand_range_f32(tuple.0, tuple.1);
}

pub fn rand_range_i32(low: i32, high: i32) -> i32 {
    return low + ((random() as i32) * (high - low) as i32) as i32;
}

pub fn rand_range_t_i32(tuple: (i32, i32)) -> i32 {
    return rand_range_i32(tuple.0, tuple.1);
}

pub fn rand_range_u8(low: u8, high: u8) -> u8 {
    return low + ((random() as u8) * (high - low) as u8) as u8;
}

pub fn rand_range_t_u8(tuple: (u8, u8)) -> u8 {
    return rand_range_u8(tuple.0, tuple.1);
}

fn max_f(a: f32, b: f32) -> f32 {
    match a > b {
        true => a,
        false => b,
    }
}

fn min_f(a: f32, b: f32) -> f32 {
    match a < b {
        true => a,
        false => b,
    }
}

#[wasm_bindgen]
#[derive(Debug, Copy, Clone)]
pub struct Pos {
    pub x: f32,
    pub y: f32,
}

#[wasm_bindgen]
#[derive(Debug, Copy, Clone)]
pub struct Individual {
    incubation_period: u8,
    days_to_recover: u8,
    age: u8,
    is_alive: bool,
    days_infected: f32,
    percent_infected_quarantine_threshold: f32,
    velocity: Pos,
    pub position: Pos,
}

const POPULATION_SIZE: u16 = 500;

#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct Population {
    pub size: u32,
    pub percent_infected: f32,
    performance_coeff: f32,
    infection_dist: f32,
    individuals: Vec<Individual>,
}

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum IndividualState {
    Dead = 0,
    Uninfected = 1,
    Incubating = 2,
    Symptomatic = 3,
    Recovered = 4,
}

#[wasm_bindgen]
impl Individual {
    pub fn state(&mut self) -> IndividualState {
        if !self.is_alive {
            return IndividualState::Dead;
        }

        if self.days_infected == 0.0 {
            return IndividualState::Uninfected;
        }

        if self.days_infected <= self.incubation_period as f32 {
            return IndividualState::Incubating;
        }

        if self.days_infected <= self.days_to_recover as f32 {
            return IndividualState::Symptomatic;
        }

        return IndividualState::Recovered;
    }
}

//
// Individual variable ranges
//

const INITIAL_INFECTED_COUNT: u8 = 50;
const INCUBATION_LENGTH_RANGE: (u8, u8) = (4, 20);
const RECOVERY_LENGTH_RANGE: (u8, u8) = (4, 20);
const AGE_RANGE: (u8, u8) = (1, 90);
const QUARANTINE_THRESHOLD_PERCENT_RANGE: (u8, u8) = (0, 80);
const MAX_NEW_IMPULSE: f32 = 0.1;

//
// Tick constants
//

const DAY_TRANSMISSION_PROBABILITY: f32 = 0.8;
// Decrease infection radius as population size n increases
// n^(INFECTION_DIST_POW)
const INFECTION_DIST_POW: f32 = -0.5;
// As population size n increases, we randomly skip checking proximity with all other individuals
// in a tick with probability 1 - n^(SPEED_SLOP_POW)
const SPEED_SLOP_POW: f32 = -0.1;
const DAY_BASE_NEW_MOVEMENT_PROBABILITY: f32 = 0.5;

// The effect P, the proportion of population infected, has on the probability of an individual
// making a new movement in a tick
const P_MOVEMENT_PROBABILITY_COEFF_POW: f32 = 1.0 / 5.0;
fn p_movement_probability_coeff(p: f32) -> f32 {
    return 1.0 - p.powf(P_MOVEMENT_PROBABILITY_COEFF_POW);
}

// The effect P, the proportion of population infected, has on the magnitude of new movements by an
// individual in a tick
const P_IMPULSE_SIZE_COEFF_MAX_EFFECT: f32 = 0.75;
fn p_impulse_size_coeff(p: f32) -> f32 {
    return 1.0 - (p * P_IMPULSE_SIZE_COEFF_MAX_EFFECT);
}

const DAY_VELOCITY_DECAY: f32 = 0.8;
const MOVE_IN_QUARANTINE_PROBABILITY: f32 = 0.05;

#[wasm_bindgen]
impl Population {
    pub fn new_with_size(size: u32) -> Population {
        let mut individuals = Vec::with_capacity(size as usize);

        for i in 0u32..size {
            // Infect first n so that we can get the ball rolling
            let is_infected: bool = i < INITIAL_INFECTED_COUNT as u32;
            let incubation_period = rand_range_t_u8(INCUBATION_LENGTH_RANGE);

            let days_to_recover: u8 = incubation_period + (rand_range_t_u8(RECOVERY_LENGTH_RANGE));
            let age: u8 = rand_range_t_u8(AGE_RANGE);

            let mut days_infected = 0.0;

            if is_infected {
                days_infected = 1.0;
            }

            let percent_infected_quarantine_threshold =
                1.0 - (rand_range_t_u8(QUARANTINE_THRESHOLD_PERCENT_RANGE) as f32 / 100.0);

            let individual: Individual = Individual {
                incubation_period,
                days_to_recover,
                age,
                is_alive: true,
                days_infected,
                percent_infected_quarantine_threshold,
                position: Pos {
                    x: random() as f32,
                    y: random() as f32,
                },
                velocity: Pos {
                    x: rand_range_f32(-MAX_NEW_IMPULSE, MAX_NEW_IMPULSE),
                    y: rand_range_f32(-MAX_NEW_IMPULSE, MAX_NEW_IMPULSE),
                },
            };
            individuals.push(individual);
        }

        let infection_dist = (size as f32).powf(INFECTION_DIST_POW);
        let performance_coeff = (size as f32).powf(SPEED_SLOP_POW);

        Population {
            individuals,
            size,
            performance_coeff,
            infection_dist,
            percent_infected: 0.0,
        }
    }

    pub fn new() -> Population {
        Population::new_with_size(POPULATION_SIZE as u32)
    }

    pub fn first_n(&mut self, size: u32) -> Population {
        let mut new_individuals: Vec<Individual> = Vec::with_capacity(size as usize);

        for i in 0..size {
            new_individuals.push(self.individuals[i as usize]);
        }

        let infection_dist = (size as f32).powf(INFECTION_DIST_POW);
        let performance_coeff = (size as f32).powf(SPEED_SLOP_POW);

        Population {
            individuals: new_individuals,
            size,
            performance_coeff,
            infection_dist,
            // Not completely accurate but should be better on the next tick
            percent_infected: self.percent_infected,
        }
    }

    pub fn tick(&mut self, delta: f32) {
        // let _timer = Timer::new("Population::tick");

        // We treat one second as one day
        let percent_second: f32 = delta / 1000.0;

        let move_probability = DAY_BASE_NEW_MOVEMENT_PROBABILITY
            * p_movement_probability_coeff(self.percent_infected)
            * percent_second;
        let velocity_mag_coeff = p_impulse_size_coeff(self.percent_infected);

        let mut total_infected: i32 = 0;

        let velocity_friction_coeff = 1.0 - (DAY_VELOCITY_DECAY * percent_second);

        for i in 0..self.size {
            let mut individual = self.individual_at_index(i);

            let showing_symptoms = individual.days_infected > individual.incubation_period as f32
                && individual.days_infected < individual.days_to_recover as f32;

            if individual.is_alive {
                individual.position.x += individual.velocity.x * percent_second;
                individual.position.y += individual.velocity.y * percent_second;

                if individual.position.x > 1.0 {
                    individual.position.x = 0.0
                }

                if individual.position.x < 0.0 {
                    individual.position.x = 1.0
                }

                if individual.position.y > 1.0 {
                    individual.position.y = 0.0
                }

                if individual.position.y < 0.0 {
                    individual.position.y = 1.0
                }

                if random() < move_probability as f64 &&
                    !showing_symptoms &&
                    // Leave some probability that an individual will move even in quarantine
                    (self.percent_infected < individual.percent_infected_quarantine_threshold ||
                        (random() as f32) < MOVE_IN_QUARANTINE_PROBABILITY)
                {
                    individual.velocity.x +=
                        rand_range_f32(-MAX_NEW_IMPULSE, MAX_NEW_IMPULSE) * velocity_mag_coeff;
                    individual.velocity.y +=
                        rand_range_f32(-MAX_NEW_IMPULSE, MAX_NEW_IMPULSE) * velocity_mag_coeff;
                }
            }

            if individual.days_infected > 0.0 {
                total_infected += 1;
                individual.days_infected += percent_second;
                if showing_symptoms {
                    if individual.age > 60 {
                        if (random() as f32) < (0.02 * percent_second) {
                            individual.is_alive = false
                        }
                    } else {
                        if (random() as f32) < (0.001 * percent_second) {
                            individual.is_alive = false
                        }
                    }
                }
            }

            // Make costly distance calculations increasingly less as n increases to increase
            // performance
            // Note that we can skip this if the individual has been infected once because we're
            // not doing the gravity simulation
            if (random() as f32) < self.performance_coeff && individual.days_infected == 0.0 {
                // Check individual against every other individual to determine if it is
                // close enough to a vector to have the possibility of being infected
                for j in 0..self.size {
                    // Don't check individual against itself-
                    if i == j {
                        continue;
                    }

                    let other_individual = self.individuals[j as usize];

                    if other_individual.days_infected == 0.0
                        || other_individual.days_infected > other_individual.days_to_recover as f32
                        || !other_individual.is_alive
                    {
                        continue;
                    }

                    let dist_x = individual.position.x - other_individual.position.x;
                    let dist_y = individual.position.y - other_individual.position.y;

                    // If the other point isn't within a box of width 2*self.infection_dist around this individual,
                    // it's not going to be within a circle r = self.infection_dist

                    // TODO: Determine whether this check actually provides any frame rendering
                    // time savings
                    if dist_x.abs() > self.infection_dist || dist_y.abs() > self.infection_dist {
                        continue;
                    }

                    let dist = (dist_x.powi(2) + dist_y.powi(2)).sqrt();

                    // 80% chance of catching disease after being near another individual for half a
                    // second
                    if dist < self.infection_dist
                        && random() < (DAY_TRANSMISSION_PROBABILITY * (percent_second)) as f64
                    {
                        individual.days_infected = 1.0;
                    }
                }
            }

            individual.velocity.x *= velocity_friction_coeff;
            individual.velocity.y *= velocity_friction_coeff;

            // individual.velocity.x = max_f(-1.0, min_f(1.0, individual.velocity.x));
            // individual.velocity.y = max_f(-1.0, min_f(1.0, individual.velocity.y));
            self.individuals[i as usize] = individual;
        }

        self.percent_infected = total_infected as f32 / self.size as f32;
    }

    pub fn individual_at_index(&mut self, i: u32) -> Individual {
        return self.individuals[i as usize];
    }
}
