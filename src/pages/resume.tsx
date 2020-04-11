import * as React from "react"
import { Link, graphql } from "gatsby"

// import Layout from "../components/layout"
import SEO from "../components/seo"
// import { rhythm } from "../utils/typography"
import {
  MDXConnection,
  ResumeBio,
  ResumeEducationItem,
  ResumeInfo,
  ResumeProjectItem,
  ResumeSkills,
  ResumeWorkItem,
  SiteNode,
} from "../queries"
import "./resume.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons"
import { faClock, faGlobe, faStar } from "@fortawesome/free-solid-svg-icons"
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons"
import { ChangeEvent } from "react"

class Resume extends React.Component<ResumeProps, ResumeState> {
  constructor(props: ResumeProps) {
    super(props)
    this.state = {
      projectsVisibilityState: "selected",
    }
  }
  render() {
    const { data } = this.props

    const { info, education, bio, projects, work, skills } = data.resumeYaml

    const educationElements = education
      .filter(educationItem => educationItem.featured)
      .map((educationItem, index) => {
        const additionalInfo = educationItem.additionalInfo ?? []

        const additionalInfoElements = additionalInfo.map(
          additionalInfoItem => {
            return (
              <li dangerouslySetInnerHTML={{ __html: additionalInfoItem }} />
            )
          }
        )

        const relevantCoursework = educationItem.relevantCoursework ?? []

        const relevantCourseworkElements = relevantCoursework.map(
          courseworkItem => {
            return (
              <li>
                {courseworkItem.code.toUpperCase()}&mdash;{courseworkItem.name}
              </li>
            )
          }
        )

        return (
          <div key={index} className="resume-item">
            <div className="flex-row">
              <div className="flex-1">
                <p className="dates-description">
                  {educationItem.dateRange.startDate}
                  {(educationItem.dateRange.endDate ||
                    educationItem.dateRange.current) && <span>&ndash;</span>}
                  {educationItem.dateRange.endDate}
                </p>
                <h3 className="project-title">{educationItem.name}</h3>
                <p>
                  {educationItem.degree && educationItem.degree}
                  {educationItem.degree && educationItem.major && ": "}
                  {educationItem.major && educationItem.major}
                </p>
              </div>
              <div className="text-right">
                <p>{educationItem.location}</p>
              </div>
            </div>
            <ul>
              {educationItem.gpaInfo && (
                <li>
                  Cumulative GPA: {educationItem.gpaInfo.gpa} (
                  {educationItem.gpaInfo.lastUpdated})
                </li>
              )}
              {additionalInfoElements}
              {relevantCoursework.length > 0 && (
                <li>
                  Relevant coursework:
                  <ul
                    className="relevant-coursework-list"
                    style={relevantCoursework.length > 3 ? { columns: 2 } : {}}
                  >
                    {relevantCourseworkElements}
                  </ul>
                </li>
              )}
            </ul>
          </div>
        )
      })

    const contactElements: JSX.Element[] = []

    if (bio.location) {
      contactElements.push(<span>{bio.location}</span>)
    }

    if (bio.contact.phoneNumber) {
      contactElements.push(
        <span>
          {" • "}
          <a href={"tel:" + bio.contact.phoneNumber}>
            {bio.contact.phoneNumber}
          </a>
        </span>
      )
    }

    if (bio.contact.email) {
      contactElements.push(
        <span>
          {" • "}
          <a href={"mailto:" + bio.contact.email}>{bio.contact.email}</a>
        </span>
      )
    }

    const socialElements: JSX.Element[] = []

    if (bio.social.github) {
      socialElements.push(
        <p>
          <FontAwesomeIcon icon={faGithub} className={"icon"} />{" "}
          <a href={"https://www.github.com/" + bio.social.github}>
            github.com/{bio.social.github}
          </a>
        </p>
      )
    }

    if (bio.social.linkedin) {
      socialElements.push(
        <p>
          <FontAwesomeIcon icon={faLinkedin} className={"icon"} />{" "}
          <a href={"https://www.linkedin.com/in/" + bio.social.linkedin}>
            linkedin.com/in/{bio.social.linkedin}
          </a>
        </p>
      )
    }

    if (bio.social.website) {
      socialElements.push(
        <p>
          <FontAwesomeIcon icon={faGlobe} className={"icon"} />{" "}
          <a href={"https://" + bio.social.website}>{bio.social.website}</a>
        </p>
      )
    }

    const workElements = work
      .filter(workItem => workItem.featured)
      .map((workItem, index) => {
        let workName = workItem.name

        if (workItem.position) {
          workName = `${workItem.position}, ${workName}`
        }

        return (
          <div key={index} className="resume-item">
            <div className="flex-row">
              <div className="flex-1">
                <p className="dates-description">
                  {workItem.dateRange.startDate}
                  {(workItem.dateRange.endDate ||
                    workItem.dateRange.current) && <span>&ndash;</span>}
                  {workItem.dateRange.endDate}
                </p>
                <h3 className="project-title">
                  {workItem.url ? (
                    <a href={workItem.url}>{workName}</a>
                  ) : (
                    workName
                  )}
                </h3>
              </div>
              <div className="text-right">
                <p>{workItem.location}</p>
              </div>
            </div>
            <div className="project-title-technologies">
              <h3 className="project-title"></h3>
            </div>
          </div>
        )
      })

    const projectElements = projects
      .filter(
        project =>
          this.state.projectsVisibilityState == "all" || project.featured
      )
      .map((project, index) => {
        return (
          <div key={index} className="resume-item">
            <div className="project-header">
              <p className="dates-description">
                {project.dateRange.startDate}
                {(project.dateRange.endDate || project.dateRange.current) && (
                  <span>&ndash;</span>
                )}
                {project.dateRange.endDate}
              </p>
              <div className="project-title-technologies">
                <h3 className="project-title">
                  {project.url ? (
                    <a href={project.url}>{project.name}</a>
                  ) : (
                    project.name
                  )}
                </h3>
                {project.technologies && (
                  <div className="technologies">
                    {project.technologies.map((technology, index) => {
                      return <span>{technology}</span>
                    })}
                  </div>
                )}
              </div>
            </div>
            <ul>
              {project.bullets.map((bullet, index) => {
                return (
                  <li
                    key={index}
                    dangerouslySetInnerHTML={{ __html: bullet }}
                  />
                )
              })}
            </ul>
          </div>
        )
      })

    const proficientSkillElements = skills.proficient
      .filter(skill => skill.featured)
      .map((skill, index) =>
        this.mapSkillToSkillElement(skill.name, index, faStar)
      )

    const familiarSkillElements = skills.familiar
      .filter(skill => skill.featured)
      .map((skill, index) =>
        this.mapSkillToSkillElement(skill.name, index, faStarRegular)
      )

    return (
      <div>
        <SEO title={"resume"} />
        <div className="container resume">
          <div className="content">
            <header id="info">
              <div className="flex-row info-row">
                <div className="name-contact-box flex-2">
                  <span className="last-updated">
                    generated {Intl.DateTimeFormat().format(new Date())}, last
                    updated {info.lastUpdated}
                  </span>
                  <h1 className="name">{bio.name}</h1>
                  {contactElements.length > 0 && <p>{contactElements}</p>}
                </div>
                {(bio.social !== {} || bio.social) && (
                  <div className={"social-box"}>{socialElements}</div>
                )}
              </div>
            </header>
            <main>
              {education.length > 0 && (
                <section id="education">
                  <div className="section-header flex-row">
                    <h2>Education</h2>
                    <div className="section-header-line flex-1"></div>
                  </div>
                  {educationElements}
                </section>
              )}
              <section id="work">
                <div className="section-header flex-row">
                  <h2>Work experience</h2>
                  <div className="section-header-line flex-1" />
                </div>

                {workElements}
              </section>
              <section id="projects">
                <div className="section-header flex-row">
                  <select
                    value={this.state.projectsVisibilityState}
                    onChange={this.handleProjectsVisibilitySelectChange}
                    className="projects-visibility-select"
                  >
                    <option value="selected">Selected projects</option>
                    <option value="all">All projects</option>
                  </select>
                  <div className="section-header-line flex-1" />
                </div>

                {projectElements}
              </section>
              <section id="skills">
                <div className="section-header flex-row">
                  <h2>Skills</h2>
                  <div className="section-header-line flex-1" />
                </div>
                <div className="skills-list resume-item">
                  <span className="skills-legend">
                    {/*<FontAwesomeIcon icon={faStar} />*/} Proficient:
                  </span>
                  {proficientSkillElements}
                </div>
                <div className="skills-list resume-item">
                  {" "}
                  <span className="skills-legend">
                    {/*<FontAwesomeIcon icon={faStarRegular} />*/} Familiar:
                  </span>
                  {familiarSkillElements}
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    )
  }

  mapSkillToSkillElement = (
    skill: string,
    index: number,
    starType = faStar
  ): JSX.Element => {
    return (
      <span key={index}>
        {/*<FontAwesomeIcon icon={starType} />*/} {skill}
      </span>
    )
  }

  handleProjectsVisibilitySelectChange = (
    event: ChangeEvent<HTMLSelectElement>
  ): void => {
    if (!(event.target.value == "selected" || event.target.value == "all")) {
      return
    }
    this.setState({
      projectsVisibilityState: event.target.value,
    })
  }
}

export default Resume

interface ResumeProps {
  data: {
    resumeYaml: {
      info?: ResumeInfo
      bio?: ResumeBio
      education?: ResumeEducationItem[]
      work?: ResumeWorkItem[]
      projects?: ResumeProjectItem[]
      skills?: ResumeSkills
    }
  }
  location: Location
}

interface ResumeState {
  projectsVisibilityState: "selected" | "all"
}

export const pageQuery = graphql`
  query {
    resumeYaml {
      info {
        lastUpdated
      }
      bio {
        name
        blurb
        location
        contact {
          phoneNumber
          email
        }
        social {
          website
          github
          linkedin
        }
      }
      education {
        name
        degree
        major
        location
        featured
        dateRange {
          startDate
          endDate
          current
        }
        gpaInfo {
          gpa
          lastUpdated
        }
        relevantCoursework {
          code
          name
        }
        additionalInfo
      }
      work {
        name
        featured
        location
        featured
        position
        url
        dateRange {
          startDate
          endDate
          current
        }
      }
      projects {
        name
        featured
        bullets
        technologies
        url
        dateRange {
          startDate
          endDate
          current
        }
      }
      skills {
        familiar {
          name
          featured
        }
        proficient {
          name
          featured
        }
      }
    }
  }
`
