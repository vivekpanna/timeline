import pptxgen from 'pptxgenjs'
import { addDays, daysBetween, formatDate, getDate, getProjectDateRange, getTimelineGroupColors, type TimelineProject } from './timeline'

const ROWS_PER_SLIDE = 11

function colorForGroup(project: TimelineProject, group: string) {
  const colors = getTimelineGroupColors(project.groups, group, project.design)
  return { main: colors.main.slice(1).toUpperCase(), light: colors.light.slice(1).toUpperCase() }
}

export async function exportProjectToPptx(project: TimelineProject, fileName: string) {
  const pptx = new pptxgen()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'Daymark'
  pptx.subject = 'Editable project timeline'
  pptx.title = project.name
  pptx.company = 'Daymark'
  pptx.theme = {
    headFontFace: 'Aptos Display',
    bodyFontFace: 'Aptos',
  }

  const projectRange = getProjectDateRange(project)
  const start = getDate(projectRange.startDate)
  const end = addDays(getDate(projectRange.endDate), 1)
  const totalDays = Math.max(1, daysBetween(start, end))
  const chartX = 3.32
  const chartWidth = 9.48
  const tableTop = 2.02
  const rowHeight = 0.42
  const sortedItems = [...project.items].sort((left, right) => {
    const groupOrder = project.groups.indexOf(left.group) - project.groups.indexOf(right.group)
    return groupOrder || left.startDate.localeCompare(right.startDate) || left.title.localeCompare(right.title)
  })
  const groupedLayout = project.layout === 'swimlane' || project.layout === 'portfolio' || project.layout === 'roadmap'
  const quarterView = project.layout === 'roadmap' || project.layout === 'portfolio'
  const itemsPerSlide = groupedLayout ? 7 : ROWS_PER_SLIDE
  const pageCount = Math.max(1, Math.ceil(sortedItems.length / itemsPerSlide))

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const slide = pptx.addSlide()
    slide.background = { color: 'FBFCF9' }
    slide.addText(project.name, {
      x: 0.52, y: 0.31, w: 12.25, h: 0.46,
      fontFace: 'Aptos Display', fontSize: 23, bold: true, color: '20372F',
      margin: 0, breakLine: false,
    })
    slide.addText(`${formatDate(projectRange.startDate, { month: 'short', day: 'numeric', year: 'numeric' })}  -  ${formatDate(projectRange.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}    |    ${project.items.length} items`, {
      x: 0.54, y: 0.86, w: 12, h: 0.2,
      fontFace: 'Aptos', fontSize: 9, color: '718078', margin: 0,
    })
    if (pageCount > 1) {
      slide.addText(`PAGE ${pageIndex + 1} OF ${pageCount}`, {
        x: 10.7, y: 0.88, w: 2.08, h: 0.18, align: 'right',
        fontFace: 'Aptos', fontSize: 8, color: '87938B', margin: 0,
      })
    }

    slide.addText('WORKSTREAM / OWNER', {
      x: 0.54, y: 1.64, w: 2.55, h: 0.2,
      fontFace: 'Aptos', fontSize: 8, bold: true, color: '89958D', charSpacing: 0.8, margin: 0,
    })

    const monthCount = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth() + 1
    const monthStep = quarterView ? 3 : Math.max(1, Math.ceil(monthCount / 8))
    let tick = new Date(Date.UTC(start.getUTCFullYear(), quarterView ? Math.floor(start.getUTCMonth() / 3) * 3 : start.getUTCMonth(), 1))
    if (tick < start && !quarterView) tick = new Date(Date.UTC(tick.getUTCFullYear(), tick.getUTCMonth() + monthStep, 1))
    while (tick < end) {
      const rawX = chartX + (daysBetween(start, tick) / totalDays) * chartWidth
      const x = quarterView ? Math.max(chartX, rawX) : rawX
      if (x >= chartX && x <= chartX + chartWidth) {
        const label = quarterView ? `Q${Math.floor(tick.getUTCMonth() / 3) + 1} ${tick.getUTCFullYear()}` : formatDate(tick, monthCount > 24 ? { month: 'short', year: '2-digit' } : { month: 'short', year: 'numeric' })
        slide.addText(label, {
          x: Math.min(x + 0.04, chartX + chartWidth - 0.83), y: 1.62, w: 0.8, h: 0.22,
          fontFace: 'Aptos', fontSize: 8, color: '718078', margin: 0,
        })
        slide.addShape(pptx.ShapeType.line, {
          x, y: 1.9, w: 0, h: 4.86,
          line: { color: 'E7EBE6', width: 0.6 },
        })
      }
      tick = new Date(Date.UTC(tick.getUTCFullYear(), tick.getUTCMonth() + monthStep, 1))
    }

    const pageItems = sortedItems.slice(pageIndex * itemsPerSlide, (pageIndex + 1) * itemsPerSlide)
    if (pageItems.length === 0) {
      slide.addText('Add tasks and milestones to build your timeline.', {
        x: 0.54, y: 2.55, w: 6.5, h: 0.35,
        fontFace: 'Aptos', fontSize: 13, color: '87938B', margin: 0,
      })
    }

    let renderedRow = 0
    let currentGroup = ''
    pageItems.forEach((item) => {
      if (groupedLayout && item.group !== currentGroup) {
        const laneY = tableTop + renderedRow * rowHeight
        const { main: laneColor } = colorForGroup(project, item.group)
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.52, y: laneY + 0.04, w: 12.28, h: 0.3,
          fill: { color: laneColor }, line: { color: laneColor, transparency: 100 },
        })
        slide.addText(item.group, {
          x: 0.65, y: laneY + 0.11, w: 2.6, h: 0.12,
          fontFace: 'Aptos', fontSize: 8, bold: true, color: 'FFFFFF', margin: 0,
        })
        currentGroup = item.group
        renderedRow += 1
      }
      const y = tableTop + renderedRow * rowHeight
      renderedRow += 1
      const { main, light } = colorForGroup(project, item.group)
      const startX = chartX + (daysBetween(start, getDate(item.startDate)) / totalDays) * chartWidth
      const duration = Math.max(1, daysBetween(getDate(item.startDate), addDays(getDate(item.endDate), 1)))
      const barWidth = Math.max(0.08, (duration / totalDays) * chartWidth)

      slide.addShape(pptx.ShapeType.line, {
        x: 0.52, y: y + rowHeight - 0.01, w: 12.28, h: 0,
        line: { color: 'EDF0EC', width: 0.5 },
      })
      slide.addText(item.title, {
        x: 0.55, y: y + 0.055, w: 2.62, h: 0.16,
        fontFace: 'Aptos', fontSize: 9, bold: true, color: '40564B', margin: 0,
        breakLine: false,
      })
      slide.addText(`${item.group}  |  ${item.owner || 'Unassigned'}`, {
        x: 0.55, y: y + 0.235, w: 2.65, h: 0.12,
        fontFace: 'Aptos', fontSize: 7, color: main, margin: 0,
      })

      if (item.kind === 'milestone') {
        slide.addShape(pptx.ShapeType.diamond, {
          x: startX - 0.075, y: y + 0.145, w: 0.15, h: 0.15,
          fill: { color: main }, line: { color: main, transparency: 100 },
        })
        slide.addText(formatDate(item.startDate, { month: 'short', day: 'numeric' }), {
          x: Math.min(startX + 0.11, chartX + chartWidth - 0.75), y: y + 0.155, w: 0.72, h: 0.12,
          fontFace: 'Aptos', fontSize: 7, color: main, margin: 0,
        })
      } else {
        const clippedX = Math.max(chartX, startX)
        const clippedRight = Math.min(chartX + chartWidth, startX + barWidth)
        const visibleWidth = clippedRight - clippedX
        if (visibleWidth > 0) {
          slide.addShape(pptx.ShapeType.roundRect, {
            x: clippedX, y: y + 0.105, w: visibleWidth, h: 0.2,
            rectRadius: 0.04, fill: { color: light }, line: { color: main, transparency: 45, width: 0.5 },
          })
          if (item.progress > 0) {
            const progressWidth = Math.min(visibleWidth, Math.max(0, (startX + barWidth * item.progress / 100) - clippedX))
            if (progressWidth > 0) {
              slide.addShape(pptx.ShapeType.roundRect, {
                x: clippedX, y: y + 0.105, w: progressWidth, h: 0.2,
                rectRadius: 0.04, fill: { color: main }, line: { color: main, transparency: 100 },
              })
            }
          }
          if (visibleWidth > 0.55) {
            slide.addText(`${item.progress}%`, {
              x: clippedX + 0.06, y: y + 0.145, w: Math.min(0.5, visibleWidth - 0.1), h: 0.11,
              fontFace: 'Aptos', fontSize: 6.5, color: item.progress >= 55 ? 'FFFFFF' : '40564B', margin: 0,
            })
          }
        }
      }
    })

    slide.addText('EDITABLE POWERPOINT  |  DAYMARK', {
      x: 0.54, y: 7.14, w: 6.5, h: 0.16,
      fontFace: 'Aptos', fontSize: 7, bold: true, color: '98A39B', charSpacing: 0.6, margin: 0,
    })
  }

  await pptx.writeFile({ fileName })
}